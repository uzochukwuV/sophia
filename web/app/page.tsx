'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1 ml-64 px-12 py-6">
        <Navbar />

        <div className="feed-header flex items-center border-b border-gray-700 mb-8 space-x-6">
          <button className="active text-white border-b-2 border-[#0096FF] pb-2">Home</button>
          <button className="text-gray-400 hover:text-white pb-2">Following</button>
          <button className="text-gray-400 hover:text-white pb-2">Trending</button>
        </div>

        <CreatePost />

        <PostCard
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuAeq5Q_F_FyLYPpll13CtF1xS-45_Ry-BRj8gF0qifg6JyD6OM2Z9Np2tAGQSO9xouvXSP89GypRQKwgBIOkLt3d2sVO0DnqRyh0s7B2MqbhXjiO1kvK86852DCpYJGlkBKSMUp6Qk46Q1D_Zd5Xf4pbQn7Mm4o7DrfynrEo-2-uA7WmmVWwy0V0av7A8UobQaZQ2ucv8gJsYFWF0Xo03-Ft1l1Tkl5s46rXBRUI2Jqy5F3ukGgqI_JSDoBskmlqBgWje0NfJAiSG8"
          badgeIcon="auto_awesome"
          badgeText="AI Enhanced"
          badgeColorClass="text-purple-400"
          title="AI-Generated Abstract Art"
          description="Explore the latest abstract art created with AI. This piece combines vibrant colors and dynamic shapes to evoke emotion and intrigue."
          price="$15.00"
          creatorAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuC3EPFg_XqZ2TWou8w2kB97scy5HWSW7k93p9Oj7pd4vT77ba7XQjTXoJ0Mia3AErN4Ot7xTQ01Yd_rEmaWvwZWhFZN0pU8zy_tvQTasf40yN-vwxi6RsnMOuDxZ0bD2nt0lw2-U30AnUBUXBxd6yJ4Ml-4i_TC7f_IDfBMQ-Xpw82OKe5OgFyGLwXi9EKge-ZiDoioI1FSPkNT9OH6kNTNWiuA93D3IJVbX__qtSLVHEScSVnTxP-ZixRIF1trviA2XKa8S6DJp6o"
          creatorHandle="SophiaArt"
          metrics={{ likes: '1.2k', comments: '345' }}
          extraRightTop={
            <div className="absolute bottom-3 left-3 bg-gray-900/70 p-2 rounded-lg flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Processing enhancements...</span>
            </div>
          }
        />

        <PostCard
          reversed
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuBMZ06ZZoIL3ODE1FTzL1G9p-kdo6ZRjMeLqeCrPjHsXCH0y8prmzDGELLxGo-j6TeUXIRGNx9J-1gOlNX_Xzu9YNHRrXgEMMTGMP0SCsn273CHu7fMMJsgrh_DiHVcrO8-uFvywk6eCuj3cukSts3t0pBowWBvqRSXcUO_vR0fF15-JE21MxdtckSpk0d9V17OEHHLYo9-uphppzf6A1evpPkypcFXeBw4LFmzHxppQuiOlerVQ284lBJtFkxC3IJ1LkxD2Zqgji8"
          badgeIcon="group_work"
          badgeText="AI Co-created"
          badgeColorClass="text-cyan-400"
          title="Futuristic Cityscape"
          description="A stunning cityscape of the future, designed with AI. The image features towering skyscrapers, flying vehicles, and advanced technology."
          creatorAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCajcLNXT5HnJVOLE-LZNam-rQGbKstwQUCfyH3Li7c4gSEbyxCbc2IM8NhWB-h37Vwd-7MBOuDzFPECGxXyti2S0sH2tI_OLNKonexUD5N7meloRuK-p40JgTXDcVbAeDGpSaGiWgC65FJp7o9feDqLn7wSUpEgUIXmER3uNyunomsZpYD6ZntEFAVK-mv9uuP_I942fQy7q6bmaEZb__WXoLVMExeDGm73mROMO4xtDbMYzmk_y9biMmSMacfjT8yWbjoHPj9cCM"
          creatorHandle="EthanDesign"
          metrics={{ likes: '2.5k', comments: '512' }}
          extraRightTop={
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center text-xs">
              <span className="material-icons text-sm mr-1 text-cyan-400">group_work</span>
              AI Co-created
            </div>
          }
          extraMiddle={
            <div className="bg-gray-800 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-400 mb-2">Cross-platform performance</p>
              <div className="flex justify-between text-sm">
                <div className="flex items-center"><span className="material-icons text-lg text-pink-400 mr-1">camera_alt</span> 12.3k views</div>
                <div className="flex items-center"><span className="material-icons text-lg text-red-400 mr-1">play_circle</span> 8.1k views</div>
                <div className="flex items-center"><span className="material-icons text-lg text-blue-400 mr-1">flutter_dash</span> 4.5k likes</div>
              </div>
              <div className="flex space-x-2 mt-3">
                <button className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full">Optimize for Instagram</button>
                <button className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full">Optimize for TikTok</button>
              </div>
            </div>
          }
        />
      </main>
    </div>
  );
}