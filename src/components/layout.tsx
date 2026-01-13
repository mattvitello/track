import type { PropsWithChildren } from "react";
import { FaLink } from "react-icons/fa"
import Image from "next/image";
import Sidebar from "~/components/sidebar";
import Link from "next/link";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="container:none min-h-screen px-8 pt-12 md:grid-cols-12 md:px-16">
      <div className="min-h-16 inline">
          <p className="text-center md:text-left">
              <Image
                src="/track-logo.png"
                alt="Logo"
                width={93}
                height={0}
                className="-mt-30px"
              />
          </p>
      </div>
      <div className="pt-8 md:float-right md:-mt-8 md:pt-0">
        {/* <ul>
          <li>
            <Link href="https://mattvitello.com/" className="hover:bg-highlight text-sm">
              <FaLink className="inline mr-1 text-xs"/>
              mattvitello.com
            </Link>
          </li>
        </ul> */}
      </div>
      <div className="grid grid-cols-12 gap-4 pt-8 md:pt-8">
        <div className="col-span-12 sm:col-span-12 md:col-span-2 md:pt-14">
          <Sidebar/>
        </div>
        <div className="col-span-12 sm:col-span-12 md:col-span-9">
          {props.children}
        </div>
      </div>
    </main>
  );
};
