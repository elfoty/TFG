import { Outlet } from "react-router-dom";
import SideBar from "./sideBar";
import { useState } from "react";

export default function Dashboard(){
    const [openSide, setOpenSide] = useState(true);
    return(
        <div className="flex">
          <div className="flex">  
        <SideBar openSide={openSide} setOpenSide={setOpenSide} />
            </div>
          <div className="w-full">
            <Outlet/>
          </div>
        </div>
    )
}