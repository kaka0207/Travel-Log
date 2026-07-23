import CardContainer from "@/components/card-container";

const CameraCard = () => {
  return (
    <CardContainer>
      <div className="flex flex-col p-12 gap-[128px]">
        <div className="flex flex-col text-3xl">
          <h1>Camera</h1>
          <h1>& Camera Lenses</h1>
        </div>

        <div className="font-light">
          <p>
            器材只是陪伴出发的工具，真正重要的是当下的光、风、情绪，以及按下快门时毫不犹豫的心。
          </p>
        </div>
      </div>
    </CardContainer>
  );
};

export default CameraCard;
