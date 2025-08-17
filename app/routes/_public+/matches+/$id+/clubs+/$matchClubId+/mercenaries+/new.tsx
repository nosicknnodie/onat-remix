import AddMercenary from "~/template/mercenary/new/AddMercenary";
import { action } from "~/template/mercenary/new/data";
import EmailSearch from "~/template/mercenary/new/EmailSearch";
import { NewMercenaryContext, useNewMercenary } from "~/template/mercenary/new/hook";
export { action };

interface IMercenaryNewPageProps {}

const MercenaryNewPage = (_props: IMercenaryNewPageProps) => {
  const hooks = useNewMercenary();
  const fetcher = hooks.fetcher;
  return (
    <>
      <NewMercenaryContext.Provider value={hooks}>
        <fetcher.Form method="post">
          <EmailSearch />
        </fetcher.Form>
        <fetcher.Form method="post" className="space-y-2">
          <AddMercenary />
        </fetcher.Form>
      </NewMercenaryContext.Provider>
    </>
  );
};

export default MercenaryNewPage;
