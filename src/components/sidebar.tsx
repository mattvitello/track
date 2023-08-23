import Link from "next/link";

type NavItem = {
  label: string;
  url: string;
};

const Sidebar = ({}) => {
  const navItems: NavItem[] = [
    {
      label: "Film",
      url: "/film",
    },
    {
      label: "Music",
      url: "/music",
    },
  ]

  return (
    <ul className="list-none">
      {navItems.map((item, index) => {
        return (
          <Link key={index} href={item.url}>
            <li>{item.label}</li>
          </Link>
        );
      })}
    </ul>
  );
}

export default Sidebar;