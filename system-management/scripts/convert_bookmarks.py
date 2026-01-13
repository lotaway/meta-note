import re
import os
from pathlib import Path
from urllib.parse import urlparse

def get_favicon_url(url):
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return None
        return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
    except:
        return None

def parse_and_convert(html_content):
    pattern = re.compile(r'<(H3|A|DL|/DL)[^>]*>', re.IGNORECASE)
    
    md_output = []
    stack_depth = 1
    last_folder_name = "Root"
    
    pos = 0
    for match in pattern.finditer(html_content):
        tag = match.group(1).upper()
        start_pos = match.start()
        
        if tag == "H3":
            end_bracket = html_content.find(">", start_pos)
            closing_h3 = html_content.find("</H3>", end_bracket)
            if closing_h3 != -1:
                last_folder_name = html_content[end_bracket+1 : closing_h3].strip()
        
        elif tag == "DL":
            stack_depth += 1
            hashes = "#" * min(stack_depth, 6)
            md_output.append(f"{hashes} {last_folder_name}\n\n")
            
        elif tag == "/DL":
            stack_depth -= 1
            
        elif tag == "A":
            tag_text = match.group(0)
            href_match = re.search(r'HREF="([^"]+)"', tag_text, re.IGNORECASE)
            url = href_match.group(1) if href_match else ""
            
            end_bracket = html_content.find(">", start_pos)
            closing_a = html_content.find("</A>", end_bracket)
            title = html_content[end_bracket+1 : closing_a].strip() if closing_a != -1 else url
            
            favicon = get_favicon_url(url)
            if favicon:
                md_output.append(f"- ![]({favicon}) [{title}]({url})\n")
            else:
                md_output.append(f"- [{title}]({url})\n")
                
        pos = match.end()

    return "".join(md_output)

def main():
    script_dir = Path(__file__).parent
    input_file = script_dir / "favourites.html"
    output_file = script_dir / "bookmarks.md"
    
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)

    print(f"Reading from: {input_file}")
    
    try:
        with open(input_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        markdown_content = parse_and_convert(content)
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"Successfully exported to: {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Could not find file {input_file}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()