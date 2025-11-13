"use client";
import React from "react";

export function Section({title,right,children}:{title:string;right?:React.ReactNode;children:React.ReactNode}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>{right}
      </div>{children}
    </div>
  );
}
export function Chip({label,onClick}:{label:string;onClick:()=>void}) {
  return <button onClick={onClick} className="px-3 py-1 rounded-full border text-sm mr-2 mb-2">{label}</button>;
}
export function download(filename:string, text:string){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));
  a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
