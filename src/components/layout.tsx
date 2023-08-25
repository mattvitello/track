import type { PropsWithChildren } from "react";
import Image from "next/image";
import Sidebar from "~/components/sidebar";
import Link from "next/link";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="container:none min-h-screen px-4 pt-12 md:grid-cols-12 md:px-16">
      <div className="min-h-16 pb-8 md:col-span-12">
          <p className="text-center md:text-left">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Logo"
                width={88}
                height={0}
                className="-mt-5"
              />
            </Link>
          </p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-12 md:col-span-2 md:pt-14">
          <Sidebar/>
        </div>
        <div className="col-span-12 sm:col-span-12 md:col-span-8">
          {props.children}
        </div>
      </div>
    </main>
  );
};
