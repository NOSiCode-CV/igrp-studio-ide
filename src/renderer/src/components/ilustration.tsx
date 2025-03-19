import Project from '@renderer/assets/images/Illustration.svg'
import Welcome from '@renderer/assets/images/Welcome.svg'
import Empty from '@renderer/assets/images/Empty.svg'
import info from '@renderer/assets/images/info-circle.svg'

const IconMap = {
  Welcome,
  Project,
  Empty,
  info
};

interface IllustrationProps {
  name: string;
}

const Illustration: React.FC<IllustrationProps> = ({ name }: IllustrationProps) => {
  return (
    <figure className="figure mb-0">
      <img src={IconMap[name]} className="figure-img img-fluid rounded"/>
    </figure>
  )
}

export default Illustration
