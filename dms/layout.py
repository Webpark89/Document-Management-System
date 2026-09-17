lines = open("client/src/app/(main)/submissions/page.tsx", encoding="utf-8").readlines()
for i, line in enumerate(lines):
    if "setSearchQuery(" in line:
        for j in range(i-10, i+25):
            print(lines[j].rstrip())
        break
