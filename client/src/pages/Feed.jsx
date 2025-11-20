import React, { useEffect, useState } from 'react'
import { dummyPostsData } from '../assets/assets'
import Loading from '../component/Loading'
import StoriesBar from '../component/StoriesBar'
import PostCard from '../component/PostCard'
import { assets } from '../assets/assets'
import RecentMessages from '../component/RecentMessages'



const Feed = () => {

   const [feeds , setFeeds] = useState([])
   const [loading , setLoading] = useState(false)

    
  const fetchFeeds = async () => {  
    setLoading(true)
    setFeeds(dummyPostsData)
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds();
  }, []);

  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* stories and post */}
      <div>
        <StoriesBar />
        <div className="p-4 space-y-6">
          {feeds.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
      {/* Right sidebar */}
      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">Sponsored</h3>
          <img
            src={assets.sponsored_img}
            alt=""
            className="w-75 h-50 rounded-md"
          />
          <p className="text-slate-600">Email marketing</p>
          <p className="text-slate-600">SuperChange your marketing with a powerful , easy-t0-use platform built your own results</p>
        </div>
       <RecentMessages/>
      </div>
    </div>
  ) : (
    <Loading />
  );                         
}
export default Feed