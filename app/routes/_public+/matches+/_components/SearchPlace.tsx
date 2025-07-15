import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Fragment, PropsWithChildren, useState } from "react";
import { Map as KMap, MapMarker } from "react-kakao-maps-sdk";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Pagination, PaginationContent, PaginationItem } from "~/components/ui/pagination";
import { ScrollArea } from "~/components/ui/scroll-area";
import { IKakaoLocalType } from "~/libs/map";

interface IProps extends PropsWithChildren {
  onSubmit?: (value: IKakaoLocalType) => void;
}

const SearchPlace = ({ onSubmit, children }: IProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<IKakaoLocalType | null>(null);
  const [query, setQuery] = useState<string>("");
  const [placesData, setPlacesData] = useState<IKakaoLocalType[] | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total_count: 0,
    page: 1,
    is_end: true,
  });
  const { mutateAsync } = useMutation({
    mutationFn: async (value: FormData) => {
      return await fetch("/api/kakao/search", {
        method: "POST",
        body: value,
      });
    },
  });

  // 검색 키워드 수정
  const handleSetQuery = (value: string) => {
    setQuery(value);
  };
  // 검색 키워드 검색
  const handleSearchPlaceSubmit = async (value: FormData) => {
    const response = await mutateAsync(value);
    const data = await response.json();
    setPlacesData(data?.documents);
    setMeta(data?.meta);
  };

  // 검색한 장소 선택
  const handleSelectdPlace = (place: IKakaoLocalType) => {
    setSelectedPlace(place);
  };

  // 페이지 이동
  const handlePageChange = async (page: number) => {
    const formData = new FormData();
    formData.append("query", query);
    formData.append("page", page.toString());
    setPage(page);
    await handleSearchPlaceSubmit(formData);
  };

  // 검색한 장소 Submit
  const handleConfirmPlace = () => {
    if (selectedPlace) {
      onSubmit?.(selectedPlace);
    }
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>장소 찾기</DialogTitle>
            <DialogDescription>장소를 찾아보세요</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-screen space-y-2">
            <div className="w-full h-[200px]">
              <KMap
                id={"kakaoMap"}
                className={"w-full h-full"}
                center={{
                  lat: Number(selectedPlace?.y || 33.450701),
                  lng: Number(selectedPlace?.x || 126.570667),
                }}
                level={5}
              >
                {selectedPlace && (
                  <MapMarker
                    position={{
                      lat: Number(selectedPlace?.y || 33.450701),
                      lng: Number(selectedPlace?.x || 126.570667),
                    }}
                    title={selectedPlace?.place_name}
                  ></MapMarker>
                )}
              </KMap>
            </div>
            <p className="flex justify-around">
              {/* <span className="font-bold">{data?.place_name}</span>
              <span className="text-sm text-gray-500">{data?.address_name}</span> */}
            </p>
            <div className="p-2">
              <form action={handleSearchPlaceSubmit} className="flex gap-x-2">
                <Input
                  type="text"
                  name="query"
                  placeholder="장소 검색"
                  value={query}
                  onChange={(e) => handleSetQuery(e.target.value)}
                />
                <Button>검색</Button>
              </form>
            </div>
            <div className="grid grid-cols-1 min-h-[250px] grid-rows-5">
              {placesData?.map((v: IKakaoLocalType) => {
                return (
                  <Fragment key={v.id}>
                    <Button
                      variant="ghost"
                      className="flex justify-start text-left p-2 h-12"
                      onClick={() => handleSelectdPlace(v)}
                    >
                      <div className="rounded-md">
                        <p className="font-bold text-sm">{v.place_name}</p>
                        <span>{v.address_name}</span>
                      </div>
                    </Button>
                  </Fragment>
                );
              })}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <ChevronLeft />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  {page > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => handlePageChange(page - 1)}>
                      {page - 1}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" disabled={true}>
                    {page}
                  </Button>
                  {!meta?.is_end && (
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(page + 1)}>
                      {page + 1}
                    </Button>
                  )}
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={meta?.is_end}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <DialogFooter>
              <Button className="w-full" disabled={!selectedPlace} onClick={handleConfirmPlace}>
                확인
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchPlace;
