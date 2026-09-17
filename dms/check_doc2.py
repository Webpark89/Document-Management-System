lines = open("client/src/app/(main)/documents/page.tsx", encoding="utf-8").readlines()
found = False
for i, line in enumerate(lines):
    if "Type Filter" in line:
        if found:
            for j in range(i-20, i+20):
                print(lines[j].rstrip())
            break
        found = True
