/* eslint react/no-multi-comp: 0 */
import React, { useState, useContext } from 'react';
import { LayoutContext } from '@crystallize/react-layout';
import Img from '@crystallize/react-image';
import { withRouter } from 'next/router';
import isEqual from 'lodash/isEqual';

import { H1, H2, Button, screen, Outer } from 'ui';
import CategoryItem from 'components/category-item';
import { CurrencyValue } from 'components/currency-value';
import { useBasket, getVariantVATprops } from 'components/basket';
import Layout from 'components/layout';
import VariantSelector from 'components/variant-selector';
import ShapeComponents from 'components/shape/components';
import { useTopicQuery } from 'lib/graph';
import { attributesToObject } from 'lib/util/variants';

import {
  Sections,
  Media,
  MediaInner,
  Info,
  Price,
  ProductFooter,
  Summary,
  Description,
  RelatedTopics,
  TopicMap,
  TopicTitle,
  List
} from './styles';

const placeHolderImg = '/static/placeholder.png';

const ProductPage = ({ product, defaultVariant }) => {
  const layout = useContext(LayoutContext);
  const basket = useBasket();

  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  // Use the first 2 topics to fetch related products
  const topics = product.topics ? product.topics.slice(0, 2) : [];
  const topicResults = topics.map(topic =>
    useTopicQuery({
      name: topic.name,
      ancestry: topic.parent ? topic.parent.name : null
    })
  );

  const onAttributeChange = (attributes, newAttribute) => {
    const newAttributes = attributesToObject(attributes);
    newAttributes[newAttribute.attribute] = newAttribute.value;

    const newSelectedVariant = product.variants.find(variant => {
      const variantAttributes = attributesToObject(variant.attributes);
      return isEqual(variantAttributes, newAttributes);
    });

    setSelectedVariant(newSelectedVariant);
  };

  const onVariantChange = variant => setSelectedVariant(variant);

  const buy = async () => {
    const basketItemToAdd = {
      ...getVariantVATprops({ product, variant: selectedVariant }),
      ...selectedVariant,
      taxGroup: { ...product.vatType },
      id: product.id,
      variant_id: selectedVariant.id,
      name: product.name,
      path: product.path
    };

    basket.actions.addItem(basketItemToAdd);
    await layout.actions.showRight();
    basket.actions.pulsateItemInBasket(basketItemToAdd);
  };

  const selectedVariantImg =
    (selectedVariant.image || {}).url || placeHolderImg;

  const summaryComponent = product.components.find(c => c.name === 'Summary');
  const description = product.components.find(c => c.name === 'Description');

  return (
    <Outer>
      <Sections>
        <Media>
          <MediaInner>
            <Img
              src={selectedVariantImg}
              onError={e => {
                e.target.onerror = null;
                e.target.src = placeHolderImg;
              }}
              sizes={`(max-width: ${screen.sm}px) 400px, 600px`}
              alt={product.name}
            />
          </MediaInner>
        </Media>
        <Info>
          <H1>{product.name}</H1>
          <Summary>
            {summaryComponent && (
              <ShapeComponents components={[summaryComponent]} />
            )}
          </Summary>

          {product.variants.length > 1 && (
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={onVariantChange}
              onAttributeChange={onAttributeChange}
            />
          )}

          <ProductFooter>
            <Price>
              <strong>
                <CurrencyValue value={selectedVariant.price} />
              </strong>
            </Price>
            <Button onClick={buy}>Add to Basket</Button>
          </ProductFooter>
        </Info>
      </Sections>

      <Description>
        <ShapeComponents className="description" components={[description]} />
      </Description>

      {!!topics.length && (
        <RelatedTopics>
          <H2>Related</H2>

          {topicResults.map(result => {
            if (result.fetching || result.error || !result.data) {
              return null;
            }

            // We only want to show the first 4 products for a topic
            const topic = result.data.topics[0];
            const cells = topic.items
              .filter(item => item.id !== product.id)
              .slice(0, 4)
              .map(item => ({
                item: { ...item }
              }));

            if (!cells.length) {
              return null;
            }

            return (
              <TopicMap>
                <TopicTitle>{topic.name}</TopicTitle>
                <List>
                  {cells.map(cell => (
                    <CategoryItem data={cell.item} key={cell.id} />
                  ))}
                </List>
              </TopicMap>
            );
          })}
        </RelatedTopics>
      )}
    </Outer>
  );
};

const ProductPageDataLoader = ({ data }) => {
  const product = data.catalogue;
  const defaultVariant = product.variants.find(v => v.isDefault);

  if (!defaultVariant) {
    return <Layout title={product.name}>This product has no variants</Layout>;
  }

  return (
    <Layout title={product.name}>
      <ProductPage
        key={product.id}
        product={product}
        defaultVariant={defaultVariant}
      />
    </Layout>
  );
};

export default withRouter(ProductPageDataLoader);
