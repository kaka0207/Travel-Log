import CardContainer from "@/components/card-container";

export const Introduction = () => (
  <CardContainer>
    <div className="flex flex-col p-12 gap-[128px]">
      <h1 className="text-4xl">Travel</h1>
      <div className="flex flex-col gap-4 font-light">
        <p>
          把自由落在每一次出发里。这里按地点整理我走过的城市与风景，关于山海、街巷、日落，也关于那些不想被困住的时刻。
        </p>
      </div>
    </div>
  </CardContainer>
);
