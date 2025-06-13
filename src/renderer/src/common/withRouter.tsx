import { useNavigate } from 'react-router-dom'

/* function withRouter(Component: any) {
  function ComponentWithRouterProp(props: any) {
    const location = useLocation()
    const navigate = useNavigate()
    const params = useParams()
    return <Component {...props} router={{ location, navigate, params }} />
  }

  return ComponentWithRouterProp
}

export default withRouter */


// withRouter.tsx
import { ComponentType } from 'react';

export interface WithRouterProps {
    navigate: ReturnType<typeof useNavigate>;
}

export function withRouter<T extends WithRouterProps>(WrappedComponent: ComponentType<T>) {
    return (props: Omit<T, keyof WithRouterProps>) => {
        const navigate = useNavigate();
        return <WrappedComponent {...(props as T)} navigate={navigate} />;
    };
}