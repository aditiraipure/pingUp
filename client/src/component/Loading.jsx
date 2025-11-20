

const Loading = ({height = '100vh'}) => {
  return (
    <div style={{height}} className="  flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-3  border-purple-600 border-t-transparent">
   <h1>loading...</h1>
      </div>
 </div>
   
  );
}
export default Loading