lines = open("client/src/app/(main)/documents/page.tsx", encoding="utf-8").readlines()
for i, line in enumerate(lines):
    if "Type Filter" in line:
        for j in range(i-20, i+5):
            print(lines[j].rstrip())
        break
