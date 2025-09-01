'use client';

export default function Sidebar() {
  return (
    <aside className="sidebar fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] p-6 flex flex-col">
      <div className="flex items-center mb-10">
        <span className="material-icons text-3xl text-blue-500 mr-2">neurology</span>
        <h1 className="text-xl font-bold text-white">Neural Creator</h1>
      </div>

      <nav className="flex flex-col space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Feed</p>
        <a className="nav-link active flex items-center p-3 rounded-md text-white bg-[#0096FF]" href="#">
          <span className="material-icons mr-4">home</span>
          Home
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">people</span>
          Following
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">trending_up</span>
          Trending
        </a>

        <p className="text-xs text-gray-500 uppercase tracking-wider mt-6 mb-2">Create</p>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">auto_awesome</span>
          AI Studio
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">auto_fix_high</span>
          AI Assistant
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">people_outline</span>
          Collaborate
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">publish</span>
          Publish
        </a>

        <p className="text-xs text-gray-500 uppercase tracking-wider mt-6 mb-2">Economy</p>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">attach_money</span>
          Earnings
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">token</span>
          NFTs
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">store</span>
          Marketplace
        </a>

        <p className="text-xs text-gray-500 uppercase tracking-wider mt-6 mb-2">Community</p>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">message</span>
          Messages
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">group</span>
          Groups
        </a>
        <a className="nav-link flex items-center p-3 rounded-md text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-white" href="#">
          <span className="material-icons mr-4">event</span>
          Events
        </a>
      </nav>

      <div className="ai-assistant-card mt-auto bg-[#252525] rounded-xl p-4 text-center">
        <img
          alt="AI Assistant avatar"
          className="w-16 h-16 rounded-full mx-auto mb-3"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlujsFGgg5K7ZDBBW_8_i5XnFkC9ogOhz9swaPiUVdMCZVmSS4FgupbOL_dTLY0leQw6oUIJDmbjm3-OUa_TgghIDELSxGGCO4oNvuzmjQR74DbEdd6UVOJ7NE4v2ruGTd5P27aFoyjp_cXB7-GMuqdQU3nzIpx3rA8bq_i0_x41NChaog0lkULL1_7A4k41Ze9La7azDVp-J52Hd6XvuNxMWNy-hNEC1FzlUhz9IQlQyoG8F9Z_Kw2jPLfgqyrRKfnV3tOxGfAPI"
        />
        <p className="text-sm text-gray-400 mb-4">How can I help you create today?</p>
        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600">
          Get Started
        </button>
      </div>
    </aside>
  );
}