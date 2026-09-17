import re

with open('client/src/app/(main)/documents/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern_toolbar = r'\{\/\* TOOLBAR \*\/\}.*?(?=\{\/\* TABLE \*\/\})'

new_toolbar = '''{/* TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-4">
          <div className="flex flex-col xl:flex-row gap-4">
            
            {/* Search */}
            {hasPerm('search_filter') && (
            <div className="relative flex-1 w-full xl:max-w-[300px] shrink-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เลขที่, ผู้ขอ, แผนก..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all focus:bg-white shadow-sm"
              />
            </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
              
              {/* Type Filter */}
              {hasPerm('search_filter') && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">ประเภท:</span>
                  {[
                    { value: "All", label: "ทุกประเภท" },
                    { value: "PR", label: "PR" },
                    { value: "PO", label: "PO" },
                    { value: "BK", label: "BK" },
                    { value: "DOC", label: "DOC" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        if (type.value === "All") {
                          setTypeFilters(["All"]);
                        } else {
                          let newFilters = typeFilters.includes("All") ? [] : [...typeFilters];
                          if (newFilters.includes(type.value)) {
                            newFilters = newFilters.filter((t) => t !== type.value);
                          } else {
                            newFilters.push(type.value);
                          }
                          if (newFilters.length === 0) newFilters = ["All"];
                          setTypeFilters(newFilters);
                        }
                      }}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors whitespace-nowrap shadow-sm ${
                        typeFilters.includes(type.value)
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {typeFilters.includes(type.value) && <Check className="w-3 h-3" />}
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">แผนก:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-700 font-semibold focus:outline-none hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <option value="">ทั้งหมด</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Personnel Filter */}
              <div className="flex items-center relative shrink-0" ref={personnelRef}>
                <button
                  type="button"
                  onClick={() => setIsPersonnelPopoverOpen(!isPersonnelPopoverOpen)}
                  className={`flex items-center gap-2 border rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none transition-colors shadow-sm ${(selectedCreators.length > 0 || selectedApprovers.length > 0) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">ผู้เกี่ยวข้อง</span>
                  <span className="sm:hidden">บุคคล</span>
                  {(selectedCreators.length > 0 || selectedApprovers.length > 0) ? ` (${selectedCreators.length + selectedApprovers.length})` : ''}
                  <ChevronDown className={`w-3.5 h-3.5 ${(selectedCreators.length > 0 || selectedApprovers.length > 0) ? 'text-blue-500' : 'text-slate-400'}`} />
                </button>

                {isPersonnelPopoverOpen && (
                  <div className="absolute top-full right-0 sm:right-auto sm:-left-1/2 md:auto mt-2 w-[320px] sm:w-[500px] md:w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="ค้นหารายชื่อผู้เกี่ยวข้อง..."
                          value={personnelSearch}
                          onChange={(e) => setPersonnelSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row max-h-[350px] overflow-hidden">
                      {/* Creators */}
                      <div className="flex-1 overflow-y-auto p-2 border-b sm:border-b-0 sm:border-r border-slate-100 min-w-[200px]">
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest sticky top-0 bg-white z-10">ผู้สร้าง</div>
                        <div className="space-y-0.5">
                          {allSystemUsers
                            .filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase()))
                            .map(user => (
                              <label key={`creator-${user.id}`} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedCreators.includes(user.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedCreators(prev => [...prev, user.name]);
                                    else setSelectedCreators(prev => prev.filter(n => n !== user.name));
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-1 shrink-0"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">{user.name}</span>
                              </label>
                            ))}
                          {allSystemUsers.filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase())).length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 font-medium">ไม่พบผู้ใช้</div>
                          )}
                        </div>
                      </div>

                      {/* Approvers */}
                      <div className="flex-1 overflow-y-auto p-2 min-w-[200px]">
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest sticky top-0 bg-white z-10">ผู้อนุมัติ</div>
                        <div className="space-y-0.5">
                          {allSystemUsers
                            .filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase()))
                            .map(user => (
                              <label key={`approver-${user.id}`} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedApprovers.includes(user.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedApprovers(prev => [...prev, user.name]);
                                    else setSelectedApprovers(prev => prev.filter(n => n !== user.name));
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-1 shrink-0"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">{user.name}</span>
                              </label>
                            ))}
                          {allSystemUsers.filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase())).length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 font-medium">ไม่พบผู้ใช้</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">ช่วงวันที่:</span>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent text-[10px] sm:text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer w-24 sm:w-auto"
                  />
                  <span className="text-[10px] sm:text-xs text-slate-300">-</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent text-[10px] sm:text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer w-24 sm:w-auto"
                  />
                </div>
              </div>
              
              {/* Clear Button */}
              {(dateFrom || dateTo || deptFilter || selectedCreators.length > 0 || selectedApprovers.length > 0 || search || typeFilters.length > 0 && typeFilters[0] !== "All") && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(""); setDateTo(""); setDeptFilter(""); setSelectedCreators([]); setSelectedApprovers([]); setPersonnelSearch(""); setSearch(""); setTypeFilters(["All"]); }}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors shrink-0 ml-1"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>
'''

content = re.sub(pattern_toolbar, new_toolbar, content, flags=re.DOTALL)

with open('client/src/app/(main)/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Toolbar updated")
