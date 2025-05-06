import { Link } from "@remix-run/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";

interface IClubsPageProps {}

const ClubsPage = (_props: IClubsPageProps) => {
  return (
    <>
      <div className="flex justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>클럽</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <Button variant="outline" asChild>
            <Link to={"/clubs/new"}>new</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ClubsPage;
