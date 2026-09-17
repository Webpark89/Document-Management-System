lines = open("client/src/app/(main)/documents/page.tsx", encoding="utf-8").readlines()
for i, line in enumerate(lines):
    if "type.value === \"All\"" in line:
        for j in range(i-5, i+15):
            print(lines[j].rstrip())
        break
