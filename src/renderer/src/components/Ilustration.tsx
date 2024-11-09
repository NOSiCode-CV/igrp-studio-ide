import Project from '@renderer/assets/images/Illustration.svg'
import Welcome from '@renderer/assets/images/Welcome.svg'
import Empty from '@renderer/assets/images/Empty.svg'
import info from '@renderer/assets/images/info-circle.svg'

const IconMap = {
  "Welcome": Welcome,
  "Project": Project,
  Empty,
  info
};

interface IllustrationProps {
  name: string;

}

const Illustration: React.FC<IllustrationProps> = ({ name }: IllustrationProps): JSX.Element => {
  return (
    <>
      <figure className="figure mb-0">
        <img src={IconMap[name]} className="figure-img img-fluid rounded" alt="..." />
      </figure>
    </>
  )
}

export default Illustration
