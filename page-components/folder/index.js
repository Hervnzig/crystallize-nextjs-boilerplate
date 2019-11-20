import React from 'react';

// import { Grid } from '@crystallize/grid-renderer/react';
import { Outer, Header, H1 } from 'ui';
import Layout from 'components/layout';
import Product from 'components/category-item';
import ShapeComponents from 'components/shape/components';

import { List } from './styles';

export default class FolderPage extends React.PureComponent {
  render() {
    const { data } = this.props;
    const folder = data.catalogue;
    const { children } = folder;

    const cells = children
      ? children.map(item => ({
          item: {
            ...item
          }
        }))
      : null;
    return (
      <Layout title={folder.name}>
        <Outer>
          <Header centerContent={!children}>
            <H1>{folder.name}</H1>
            <ShapeComponents components={folder.components} />
          </Header>
          {children && (
            <List>
              {cells.map(cell => (
                <Product data={cell.item} key={cell.id} />
              ))}
            </List>
          )}
        </Outer>
      </Layout>
    );
  }
}
