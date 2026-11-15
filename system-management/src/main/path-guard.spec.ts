import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { isWithinRoot, isNonEmptyString, DirectoryAllowlist } from './path-guard'

const root = path.resolve('sandbox-root')

describe('isWithinRoot', () => {
  it('accepts the root itself', () => {
    expect(isWithinRoot(root, root)).toBe(true)
  })

  it('accepts nested paths below the root', () => {
    expect(isWithinRoot(path.join(root, 'nested', 'clip.mp4'), root)).toBe(true)
  })

  it('rejects parent traversal', () => {
    expect(isWithinRoot(path.join(root, '..', 'secret.txt'), root)).toBe(false)
  })

  it('rejects a sibling sharing the same prefix', () => {
    expect(isWithinRoot(`${root}-evil`, root)).toBe(false)
  })

  it('rejects an unrelated absolute path', () => {
    expect(isWithinRoot(path.resolve('elsewhere'), root)).toBe(false)
  })
})

describe('isNonEmptyString', () => {
  it('rejects blanks and non-string values', () => {
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(42)).toBe(false)
  })

  it('accepts a real path', () => {
    expect(isNonEmptyString('/tmp/clip.mp4')).toBe(true)
  })
})

describe('DirectoryAllowlist', () => {
  it('denies every path before a grant', () => {
    const allowlist = new DirectoryAllowlist()
    expect(allowlist.isAllowed(path.join(root, 'clip.mp4'))).toBe(false)
  })

  it('allows paths inside a granted root', () => {
    const allowlist = new DirectoryAllowlist()
    allowlist.grant(root)
    expect(allowlist.isAllowed(path.join(root, 'nested', 'clip.mp4'))).toBe(true)
  })

  it('keeps duplicate grants idempotent', () => {
    const allowlist = new DirectoryAllowlist()
    allowlist.grant(root)
    allowlist.grant(path.join(root, '.'))
    expect(allowlist.grantedRoots).toHaveLength(1)
  })

  it('rejects traversal and blank paths after a grant', () => {
    const allowlist = new DirectoryAllowlist()
    allowlist.grant(root)
    expect(allowlist.isAllowed(path.join(root, '..', 'secret.txt'))).toBe(false)
    expect(allowlist.isAllowed('  ')).toBe(false)
  })

  it('throws when granting an empty path', () => {
    const allowlist = new DirectoryAllowlist()
    expect(() => allowlist.grant('')).toThrow(/non-empty directory/)
  })
})
