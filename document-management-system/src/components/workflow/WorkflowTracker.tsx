"use client";

import React from "react";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { WorkflowData } from "@/features/workflow/api";

interface WorkflowTrackerProps {
  workflow: WorkflowData;
}

export function WorkflowTracker({ workflow }: WorkflowTrackerProps) {
  if (!workflow || !workflow.steps) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">สถานะการอนุมัติ (Workflow Tracker)</h3>
      
      <div className="relative pl-6 sm:pl-8 before:absolute before:inset-0 before:ml-4 sm:before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent space-y-8">
        {workflow.steps.map((step, index) => {
          let Icon = Circle;
          let iconColor = "text-gray-300";
          let bgColor = "bg-white";
          let borderColor = "border-gray-100";
          
          if (step.status === "Approved") {
            Icon = CheckCircle2;
            iconColor = "text-emerald-500";
            bgColor = "bg-emerald-50/50";
            borderColor = "border-emerald-100";
          } else if (step.status === "Rejected") {
            Icon = XCircle;
            iconColor = "text-rose-500";
            bgColor = "bg-rose-50/50";
            borderColor = "border-rose-100";
          } else if (step.status === "Pending") {
            if (step.stepOrder === workflow.currentStep) {
              Icon = Clock;
              iconColor = "text-blue-500";
              bgColor = "bg-blue-50/50";
              borderColor = "border-blue-100";
            } else {
              Icon = Circle;
              iconColor = "text-gray-300";
              bgColor = "bg-gray-50/50";
              borderColor = "border-gray-100";
            }
          }

          return (
            <div key={step.id} className="relative flex items-start group">
              {/* Timeline dot */}
              <div className="absolute -left-6 sm:-left-8 flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-white bg-white shadow-sm shrink-0 z-10 top-1">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
              </div>
              
              {/* Content Card */}
              <div className={`w-full p-4 sm:p-5 rounded-xl border ${borderColor} ${bgColor} shadow-sm transition-all hover:shadow-md ml-2`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-gray-900 text-base">{step.roleName}</h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${
                    step.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    step.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                    step.status === 'Pending' && step.stepOrder === workflow.currentStep ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {step.status === "Pending" && step.stepOrder !== workflow.currentStep ? "Waiting" : step.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {step.approverName && (
                    <p className="text-gray-600">
                      ผู้อนุมัติ: <span className="font-semibold text-gray-800">{step.approverName}</span>
                    </p>
                  )}
                  
                  {step.actionDate && (
                    <p className="text-gray-500 flex items-center gap-1.5 sm:justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      {step.actionDate}
                    </p>
                  )}
                </div>
                
                {step.comment && (
                  <div className="mt-4 p-3.5 bg-white rounded-lg border border-gray-100 relative shadow-sm">
                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45"></div>
                    <p className="text-sm text-gray-700 relative z-10 font-medium">"{step.comment}"</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
