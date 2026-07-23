import CardContainer from "@/components/card-container";

const AboutCard = () => {
  return (
    <CardContainer>
      <div className="flex flex-col p-12 gap-[128px]">
        <h1 className="text-3xl">About</h1>
        <div className="flex flex-col gap-4 font-light">
          <p>
            我相信，自由不是远方给出的答案，而是每一天认真生活时长出来的勇气。我热爱热烈的风景，也珍惜日常里一闪而过的光。
          </p>

          <p>
            这些照片记录我走过的城市、遇见的海风和停留过的片刻。欢迎你慢慢走进我的世界。
          </p>
        </div>
      </div>
    </CardContainer>
  );
};

export default AboutCard;
