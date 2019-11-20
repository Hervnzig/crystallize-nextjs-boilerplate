import React from 'react';
import queryString from 'query-string';
import styled from 'styled-components';

import Layout from 'components/layout';
import { BasketContext } from 'components/basket';
import BillingDetails from 'components/billing-details';
import OrderItems from 'components/order-items';
import { H1, H3, Outer, Header, colors } from 'ui';

const CustomHeader = styled(Header)`
  margin-bottom: 0;
  padding-bottom: 0;
`;

const Line = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${colors.light};
`;

class Confirmation extends React.Component {
  state = {
    emptied: false,
    orderData: null
  };

  static async getInitialProps({ req }) {
    const { query } = queryString.parseUrl(req.url);
    return { orderId: query.order_id, paymentMethod: query.payment_method };
  }

  componentDidMount() {
    const { orderId, paymentMethod } = this.props;
    this.empty();

    let url = `/api/order-confirmation?order_id=${orderId}`;
    if (paymentMethod) url = `${url}&payment_method=${paymentMethod}`;
    fetch(url)
      .then(res => res.json())
      .then(orderData => this.setState({ orderData }));
  }

  static contextType = BasketContext;

  empty() {
    const { emptied } = this.state;
    const { actions } = this.context;
    if (!emptied) {
      actions.empty();
      this.setState({ emptied: true });
    }
  }

  render() {
    const { orderId } = this.props;
    const { orderData } = this.state;

    if (!orderData || !orderData.data) {
      return <Layout loading />;
    }

    const order = orderData.data.orders.get;
    const { email } = order.customer.addresses[0];

    const items = order.cart.map(item => ({
      ...item,
      image: {
        url: item.imageUrl
      },
      price: item.price.net
    }));

    return (
      <Layout title="Order Summary">
        <Outer>
          <CustomHeader>
            <H1>Order Summary</H1>
            <p>
              Your order (<strong>#{orderId}</strong>) has been confirmed. A
              copy of your order has been sent to <strong>{email}</strong>.
            </p>
            <Line />
            <BillingDetails order={order} />
            <Line />
            <H3>Order Items</H3>
            <OrderItems items={items} />
          </CustomHeader>
        </Outer>
      </Layout>
    );
  }
}

export default Confirmation;
