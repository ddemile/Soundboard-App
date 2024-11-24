import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx'
import {
  keepPreviousData,
  useInfiniteQuery
} from '@tanstack/react-query'
import {
  ColumnDef,
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  Row,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


interface APIResult {
  count: number,
  sound: {
    title: string,
    id: string,
    emoji?: string,
    emojiName?: string,
    authorId: string,
  }
}

export type PersonApiResponse = {
  data: APIResult[]
  meta: {
    totalRowCount: number
  }
}

const range = (len: number) => {
  const arr: number[] = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPerson = (index: number): APIResult => {
  return {
    count: 10,
    sound: {
      authorId: "jean",
      title: `Person ${index + 1}`,
      id: `Person ${index + 1}`,
      emoji: "👋",
      emojiName: "👋",
    }
  }
}

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): APIResult[] => {
    const len = lens[depth]!
    return range(len).map((d): APIResult => {
      return {
        ...newPerson(d),
      }
    })
  }

  return makeDataLevel()
}

const data = makeData(1000)

//simulates a backend api
export const fetchData = async (
  start: number,
  size: number,
  sorting: SortingState
) => {
  const dbData = [...data]
  if (sorting.length) {
    const sort = sorting[0] as ColumnSort
    const { id, desc } = sort as { id: keyof APIResult; desc: boolean }
    dbData.sort((a, b) => {
      if (desc) {
        return a[id] < b[id] ? 1 : -1
      }
      return a[id] > b[id] ? 1 : -1
    })
  }

  //simulate a backend api
  await new Promise(resolve => setTimeout(resolve, 200))

  return {
    data: dbData.slice(start, start + size),
    meta: {
      totalRowCount: dbData.length,
    },
  }
}


const fetchSize = 50

export default function App() {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<APIResult>[]>(
    () => [
      // {
      //   id: "place",
      //   accessorFn: (row) => row.count,
      //   header: "#",
      //   cell: info => <code>{info.getValue()}</code>,
      //   size: 60,
      // },
      {
        id: "title",
        header: "Title",
        accessorFn: (row) => row.sound.title,
        cell: info => info.getValue(),
        size: 600
      },
      {
        accessorFn: row => row.count,
        id: 'uses',
        cell: info => info.getValue(),
        header: () => <span>Uses</span>,
        size: 500
      },
      // {
      //   id: "actions",
      //   enableHiding: false,
      //   cell: ({ row }) => {
      //     const payment = row.original
     
      //     return (
      //       <DropdownMenu>
      //         <DropdownMenuTrigger asChild className='ml-auto'>
      //           <Button variant="ghost" className="h-8 w-8 p-0">
      //             <span className="sr-only">Open menu</span>
      //             <MoreHorizontal className="h-4 w-4" />
      //           </Button>
      //         </DropdownMenuTrigger>
      //         <DropdownMenuContent align="end">
      //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
      //           <DropdownMenuItem
      //             onClick={() => navigator.clipboard.writeText("payment.id")}
      //           >
      //             Copy payment ID
      //           </DropdownMenuItem>
      //           <DropdownMenuSeparator />
      //           <DropdownMenuItem>View customer</DropdownMenuItem>
      //           <DropdownMenuItem>View payment details</DropdownMenuItem>
      //         </DropdownMenuContent>
      //       </DropdownMenu>
      //     )
      //   },
      //   size: Number.MAX_SAFE_INTEGER
      // }
    ],
    []
  )

  //react-query has a useInfiniteQuery hook that is perfect for this use case
  const { data, fetchNextPage, isFetching, isLoading } =
    useInfiniteQuery<PersonApiResponse>({
      queryKey: [
        'people',
        sorting, //refetch when sorting changes
      ],
      queryFn: async ({ pageParam = 0 }) => {
        const start = (pageParam as number) * fetchSize
        const fetchedData = await fetchData(start, fetchSize, sorting) //pretend api call
        return fetchedData
      },
      initialPageParam: 0,
      getNextPageParam: (_lastGroup, groups) => groups.length,
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    })

  //flatten the array of arrays from the useInfiniteQuery hook
  const flatData = useMemo(
    () => data?.pages?.flatMap(page => page.data) ?? [],
    [data]
  )
  const totalDBRowCount = data?.pages?.[0]?.meta?.totalRowCount ?? 0
  const totalFetched = flatData.length

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount]
  )

  //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current)
  }, [fetchMoreOnBottomReached])

  const table = useReactTable({
    data: flatData,
    columns,
    state: {
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    debugTable: true,
  })

  //scroll to top of table when sorting changes
  const handleSortingChange: OnChangeFn<SortingState> = updater => {
    setSorting(updater)
    if (!!table.getRowModel().rows.length) {
      rowVirtualizer.scrollToIndex?.(0)
    }
  }

  //since this table option is derived from table row model state, we're using the table.setOptions utility
  table.setOptions(prev => ({
    ...prev,
    onSortingChange: handleSortingChange,
  }))

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  if (isLoading) {
    return <>Loading...</>
  }

  return (
    <div className="app">
      ({flatData.length} of {totalDBRowCount} rows fetched)
      <div
        onScroll={e => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '600px', //should be a fixed height
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <Table style={{ display: 'grid' }}>
          <TableHeader
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                style={{ width: '100%' }}
              >
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        flexGrow: header.getSize() === Number.MAX_SAFE_INTEGER ? 1 : undefined,
                        width: header.getSize() === Number.MAX_SAFE_INTEGER ? "auto" : header.getSize(),
                        paddingRight: 0
                      }}
                    >
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            style={{
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
              position: 'relative', //needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index] as Row<APIResult>
              return (
                <TableRow
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={node => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  style={{
                    display: 'flex',
                    position: 'absolute',
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    width: '100%',
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    return (
                      <TableCell
                        key={cell.id}
                        style={{
                          display: 'flex',
                          flexGrow: cell.column.getSize() === Number.MAX_SAFE_INTEGER ? 1 : undefined,
                          width: cell.column.getSize() === Number.MAX_SAFE_INTEGER ? undefined : cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {isFetching && <div>Fetching More...</div>}
    </div>
  )
}