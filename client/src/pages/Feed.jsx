import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Loading from '../component/Loading'
import StoriesBar from '../component/StoriesBar'
import PostCard from '../component/PostCard'
import RecentMessages from '../component/RecentMessages'
import SponsoredCarousel from '../component/SponsoredCarousel'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios'

const Feed = () => {

   const [feeds , setFeeds] = useState([])
   const [loading , setLoading] = useState(false)
   const [sponsoredAds, setSponsoredAds] = useState([])
   const { getToken } = useAuth();
   const { user } = useUser();

  const fetchFeeds = async () => {  
    try {
      setLoading(true)
      const {data} = await api.get('/api/post/feed' , {
        headers : {Authorization:`Bearer ${await getToken()}`}
      })
      if(data.success){
        setFeeds(data.posts)
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      
    }
     setLoading(false)
   }

  useEffect(() => {
    fetchFeeds();
    window.addEventListener("profile-updated", fetchFeeds);
    window.addEventListener("feed-refresh", fetchFeeds);
    return () => {
      window.removeEventListener("profile-updated", fetchFeeds);
      window.removeEventListener("feed-refresh", fetchFeeds);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchSponsoredAds = async () => {
      try {
        const { data } = await api.get('/api/sponsored', {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (active && data.success) setSponsoredAds(data.ads || []);
      } catch {
        if (active) setSponsoredAds([]);
      }
    };
    fetchSponsoredAds();
    return () => { active = false; };
  }, [getToken]);

  useEffect(() => {
    const remove = (event) => setFeeds((items) => items.filter((post) => post._id !== event.detail.postId));
    const update = (event) => setFeeds((items) => items.map((post) => post._id === event.detail.post._id ? event.detail.post : post));
    const restore = (event) => setFeeds((items) => items.some((post) => post._id === event.detail.post._id) ? items : [event.detail.post, ...items]);
    window.addEventListener("post-removed", remove);
    window.addEventListener("post-updated", update);
    window.addEventListener("post-restored", restore);
    return () => {
      window.removeEventListener("post-removed", remove);
      window.removeEventListener("post-updated", update);
      window.removeEventListener("post-restored", restore);
    };
  }, []);

  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* stories and post */}
      <div>
        <StoriesBar />
        <div className="flex justify-center px-4 pt-4 xl:hidden"><SponsoredCarousel ads={sponsoredAds} /></div>
        <div className="p-4 space-y-6">
          {feeds.map((post) => (
            <PostCard key={post._id} post={post} onPostRemoved={(postId) => setFeeds((items) => items.filter((item) => item._id !== postId))} onPostChange={(nextPost) => setFeeds((items) => items.map((item) => item._id === nextPost._id ? nextPost : item))} />
          ))}
        </div>
      </div>
      {/* Right sidebar */}
      <div className="max-xl:hidden sticky top-0">
        <SponsoredCarousel ads={sponsoredAds} />
        
        {user && <RecentMessages />}
        
      </div>
    </div>
  ) : (
    <Loading />
  );                         
}

export default Feed;
