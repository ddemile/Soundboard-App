// import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
// import { socket } from "@/hooks/useWebsocket.ts";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { useVirtualizer } from "@tanstack/react-virtual";
// import { useEffect, useRef } from "react";
// import { IconType } from "react-icons";

// function RoundedButton({ icon: Icon, onClick }: { icon: IconType, onClick?: () => void }) {
//   return (
//     <button className="focus:outline-hidden" onClick={onClick}>
//       <Icon className="rounded-full bg-zinc-800 p-1" size={30} />
//     </button>
//   )
// }

// interface APIResult {
//   count: number,
//   sound: {
//     title: string,
//     id: string,
//     emoji?: string,
//     emojiName?: string,
//     authorId: string,
//   }
// }

// async function fetchServerPage(
//   limit: number,
//   offset: number = 0,
// ): Promise<{ rows: Array<APIResult>; nextOffset: number }> {
//   // const rows = new Array(limit)
//   //   .fill(0)
//   //   .map((_, i) => `Async loaded row #${i + offset * limit}`)

//   const sounds: any[] = await socket.emitWithAck("get_trending_sounds", {
//     offset: offset * limit,
//     limit,
//   })

//   let rows = sounds.map((result, i) => {
//     // return <div className="flex h-full">
//     //   <div className="w-24 h-full flex justify-evenly items-center">
//     //     <code>{i + offset * limit + 1}</code>
//     //     <span className="text-2xl">{result.sound.emoji ?? "🎵"}</span>
//     //   </div>
//     //   {/* <div className="aspect-square h-full flex justify-center items-center">
//     //   </div> */}
//     //   <div className="flex justify-center items-start flex-col gap-0.5">
//     //     <p className="flex gap-1">
//     //       <span>{result.sound.title}</span>
//     //     </p>
//     //     <p className="text-sm">ddemile</p>
//     //   </div>
//     //   <div className="flex justify-center items-center grow ml-auto">
//     //     <div className="ml-auto flex mr-52">
//     //       <span>{result.count}</span>
//     //     </div>
//     //     <div className="mr-3 flex gap-3 items-center justify-center">
//     //       <RoundedButton
//     //         icon={BsPlayFill}
//     //         onClick={() => {
//     //           audioPlayer.getState().play({ id: `preview-${result.sound.id}`, url: `${BASE_API_URL}/sounds/${result.sound.id}`, volume: configStore.getState().config.audio.previewVolume })
//     //         }}
//     //       />
//     //       <RoundedButton icon={BsArrowDown} />
//     //     </div>
//     //   </div>
//     // </div>

//     return result
//   })

//   return { rows, nextOffset: offset + 1 }
// }

// export default function Trending() {
//   const {
//     status,
//     data,
//     error,
//     isFetching,
//     isFetchingNextPage,
//     fetchNextPage,
//     hasNextPage,
//   } = useInfiniteQuery({
//     queryKey: ["trending"],
//     queryFn: (ctx) => fetchServerPage(10, ctx.pageParam),
//     getNextPageParam: (lastPage, allPages, lastPageParam) => {
//       if (lastPage.rows.length === 0) {
//         return undefined
//       }
//       return lastPageParam + 1
//     },
//     getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
//       if (firstPageParam <= 1) {
//         return undefined
//       }
//       return firstPageParam - 1
//     },
//     initialPageParam: 0,
//   })

//   const allRows = data ? data.pages.flatMap((d) => d.rows) : []

//   const parentRef = useRef<HTMLDivElement>(null)

//   const rowVirtualizer = useVirtualizer({
//     count: hasNextPage ? allRows.length + 1 : allRows.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => 70,
//     overscan: 5,
//   })

//   useEffect(() => {
//     const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()

//     if (!lastItem) {
//       return
//     }

//     if (
//       lastItem.index >= allRows.length - 1 &&
//       hasNextPage &&
//       !isFetchingNextPage
//     ) {
//       fetchNextPage()
//     }
//   }, [
//     hasNextPage,
//     fetchNextPage,
//     allRows.length,
//     isFetchingNextPage,
//     rowVirtualizer.getVirtualItems(),
//   ])

//   return (
//     <div className="flex w-full h-full justify-center items-center overflow-y-hidden">
//       {status === 'pending' ? (
//         <p>Loading...</p>
//       ) : status === 'error' ? (
//         <span>Error: {error.message}</span>
//       ) : (
        
//         <div
//           ref={parentRef}
//           className="List"
//           style={{
//             height: '100%',
//             width: `100%`,
//             overflow: 'auto',
//           }}
//         >
//           <Table>
//         <TableCaption>A list of your recent invoices.</TableCaption>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-[50px]">#</TableHead>
//             <TableHead>Title</TableHead>
//             <TableHead>Uses</TableHead>
//             <TableHead className="text-right">Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//         <div
//             // className="divide-y-2"
//             style={{
//               height: `${rowVirtualizer.getTotalSize()}px`,
//               width: '100%',
//               position: 'relative',
//             }}
//           >
//             {rowVirtualizer.getVirtualItems().map((virtualRow) => {
//               const isLoaderRow = virtualRow.index > allRows.length - 1
//               const post = allRows[virtualRow.index]

//               return (
//                 <TableRow
//                   key={virtualRow.index}
//                   className="border-b-2 border-primary"
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     width: '100%',
//                     height: `${virtualRow.size}px`,
//                     transform: `translateY(${virtualRow.start}px)`,
//                   }}
//                 >
//                   {isLoaderRow
//                     ? hasNextPage
//                       ? 'Loading more...'
//                       : 'Nothing more to load'
//                     : <>
//                       <TableCell className="font-medium">{virtualRow.index}</TableCell>
//                       <TableCell>
//                       <div className="flex justify-center items-start flex-col gap-0.5">
//                         <p className="flex gap-1">
//                           <span>{post.sound.title}</span>
//                         </p>
//                         <p className="text-sm">ddemile</p>
//                       </div>
//                       </TableCell>
//                       <TableCell>Credit Card</TableCell>
//                       <TableCell className="text-right">$250.00</TableCell>
//                     </>}
//                 </TableRow>
//               )
//             })}
//           </div>
//         </TableBody>
//       </Table>

//         </div>
//       )}
//       {/* <div>
//         {isFetching && !isFetchingNextPage ? 'Background Updating...' : null}
//       </div> */}
//     </div>
//   )
// }