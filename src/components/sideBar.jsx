import { Network, PanelLeft ,PanelRight} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function SideBar({openSide,setOpenSide}) {
  return (
    <div className="border border-red-500 z-10">
      <div  className={`${openSide ? "left-60" : "left-5"} transition-all duration-300 fixed top-5  z-50 bg-yellow-400 p-2 rounded shadow`} 
      onClick={()=>setOpenSide(!openSide)}>
        {openSide ? <PanelRight/> : <PanelLeft/>}
      </div>
      <div
      className={` top-0 left-0 h-screen bg-yellow-500 text-black  px-6 py-8 z-40
        transform transition-transform duration-300
        ${openSide ? "w-72 " : "w-0 hidden"}`} >
        <div className="flex items-center gap-2">
          <Network />
          <span className="border-b-2 border-b-red-500 ">Grafim</span>
        </div>
        <div className="flex flex-col gap-2 text-xl mt-16 transition-all duration-75">
          <Link to="principal" className="hover:bg-red-50 px-2 rounded p-2">
            Grafo
          </Link>
          <Link to="" className="hover:bg-red-50 px-2 rounded p-2">
            sugestao
          </Link>
          <Link to="" className="hover:bg-red-50 px-2 rounded p-2">
            concluidas
          </Link>
        </div>
      </div>
    </div>
  );
}
