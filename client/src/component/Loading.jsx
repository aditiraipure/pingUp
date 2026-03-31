const Loading = ({ height = "100vh" }) => {
  return (
    <div
      style={{ height }}
      className="flex justify-center items-center w-full bg-gradient-to-br from-purple-50 to-indigo-50"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 border-r-purple-600"></div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-purple-600 animate-pulse">
            Loading...
          </h1>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
        <div className="flex gap-1">
          <div
            className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
export default Loading;
