export default function WorkInProgress() {
  return (
    <main className="h-full flex justify-center items-center">
      <div className="absolute top-[35%] sm:top-[40%] w-full">
        <div className="flex items-center justify-center flex-col gap-5 w-full">
          <span className="flex flex-col lg:flex-row items-center">
            <h1 className="text-7xl inline font-semibold text-center">
              This page is still in progress
            </h1>
          </span>
          <div className="flex">
            <h2 className="text-4xl text-center">
              Please come back later
            </h2>
          </div>
        </div>
      </div>
    </main>
  );
}
