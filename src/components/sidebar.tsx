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
      label: "Movies",
      url: "/movies",
    },
    {
      label: "Music",
      url: "/music",
    },
    {
      label: "Cooking",
      url: "/cooking",
    },
  ];

  const isActive = (url: string) => {
    return router.pathname === url;
  }

  return (
    <ul className="list-none">
      {navItems.map((item, index) => {
        return (
          <li key={index} className={`font-mono text-15 pb-4 inline mr-8 md:list-item md:mr-0 ${isActive(item.url) ? 'font-bold line-through' : ''}`}>
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