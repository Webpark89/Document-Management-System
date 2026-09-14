const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/views/components/shared/Sidebar.tsx';
let c = fs.readFileSync(path, 'utf8');

const target =             <Link
              key={item.name}
              href={item.href}
              className={navItemClass(isActive, isOpen)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <Icon
                  className={\\ \\}
                />
              )}
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>;

const replacement =             <Link
              key={item.name}
              href={item.href}
              className={navItemClass(isActive, isOpen)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <div className="relative">
                  <Icon
                    className={\\ \\}
                  />
                  {!isOpen && item.href === "/approvals" && unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white" />
                  )}
                </div>
              )}
              {isOpen && (
                <div className="flex flex-1 items-center justify-between truncate">
                  <span className="truncate">{item.name}</span>
                  {item.href === "/approvals" && unseenCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unseenCount}
                    </span>
                  )}
                </div>
              )}
            </Link>;

c = c.replace(target, replacement);

fs.writeFileSync(path, c);
console.log('done');
