import { Article, ArticleContact, ArticleHeader, Breadcrumbs, PageBase, Typography } from '@altinn/altinn-components';
import { useLocation } from 'react-router-dom';

export const ErrorPage = () => {
  const location = useLocation();
  const { componentName } = location.state || { componentName: 'Unknown Component' };

  return (
    <PageBase>
      <Article>
        <Breadcrumbs items={[{ label: 'Forside', href: '#' }, { label: 'Error' }]} />
        <ArticleHeader title={`Unexpected error in ${componentName}`}>
          <Typography>
            <p>A short explanation of what went wrong:</p>
            <ul>
              <li>
                <a href="#d">Helpful link 1</a>
              </li>
              <li>
                <a href="#a">Helpful link 2</a>
              </li>
              <li>
                <a href="#s">Helpful link 3</a>
              </li>
            </ul>
          </Typography>
        </ArticleHeader>
        <ArticleContact
          title="Trenger du hjelp?"
          items={[{ label: 'Chat med en veileder' }, { label: 'Ring 75 00 60 00' }, { label: 'Skriv til Altinn' }]}
        >
          <p>
            Maecenas sed diam eget risus varius blandit sit amet non magna. Vivamus sagittis lacus vel augue laoreet
            rutrum faucibus dolor auctor. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia
            odio sem nec elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed odio dui.
          </p>
        </ArticleContact>
      </Article>
    </PageBase>
  );
};
