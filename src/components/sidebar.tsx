import Link from "next/link";
import { useRouter } from "next/router";

type NavItem = {
  label: string;
  url: string;
};

const Sidebar = ({}) => {
  const router = useRouter();
  const navItems: NavItem[] = [
    {
      label: "Film",
      url: "/film",
    },
    {
      label: "Music",
      url: "/music",
    },
  ];

  const isActive = (url: string) => {
    return router.pathname === url;
  }

  return (
    <ul className="list-none">
      {navItems.map((item, index) => {
        return (
          <li key={index} className={`font-mono text-md pb-4 ${isActive(item.url) ? 'font-bold line-through' : ''}`}>
            <Link href={item.url} className="hover:bg-highlight">
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default Sidebar;