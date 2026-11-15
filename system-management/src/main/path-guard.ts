import path from 'node:path'

export function isWithinRoot(target: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target))
  if (relative === '') return true
  if (path.isAbsolute(relative)) return false
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) return false
  return true
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export class DirectoryAllowlist {
  private roots: string[] = []

  grant(directory: string): string {
    if (!isNonEmptyString(directory)) {
      throw new Error('A non-empty directory path is required')
    }
    const resolved = path.resolve(directory)
    if (!this.roots.includes(resolved)) {
      this.roots.push(resolved)
    }
    return resolved
  }

  isAllowed(target: unknown): boolean {
    if (!isNonEmptyString(target)) return false
    return this.roots.some(root => isWithinRoot(target, root))
  }

  get grantedRoots(): readonly string[] {
    return [...this.roots]
  }
}
