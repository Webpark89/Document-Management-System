import re

with open('client/src/views/components/shared/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''                    let isChildActive = isChildNavActive(pathname, child.href);
                    if (pathname === "/documents" && folderId) {
                      if (child.href === "/folders") isChildActive = true;
                      if (child.href === "/documents") isChildActive = false;
                    }'''

new_code = '''                    let isChildActive = isChildNavActive(pathname, child.href);
                    if (pathname === "/documents" && folderId) {
                      if (child.href === "/folders") isChildActive = true;
                      if (child.href === "/documents") isChildActive = false;
                    }
                    if (source === "submissions") {
                      isChildActive = false;
                    }'''

content = content.replace(old_code, new_code)

with open('client/src/views/components/shared/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated child active logic")
