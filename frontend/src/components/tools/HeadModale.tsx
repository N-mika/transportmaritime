import { FC } from "react";
interface HeadModaleProps {
  tittle: string
}
const HeadModale: FC<HeadModaleProps> = ({ tittle }) => {
  return (
    <div className="flex items-center p-4 pb-2 text-primary rounded-t-lg">
      <h2 className="text-2xl font-bold">{tittle}</h2>
    </div>
  )
}
export default HeadModale;