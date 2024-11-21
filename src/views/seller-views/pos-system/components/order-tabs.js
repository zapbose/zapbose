import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { DebounceSelect } from 'components/search';
import {
  CloseOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import userService from 'services/seller/user';
import { isArray } from 'lodash';
import {
  addBag,
  removeBag,
  setCartData,
  setCurrency,
  setCurrentBag,
} from 'redux/slices/cart';
import { AsyncSelect } from 'components/async-select';
import { getCartData } from 'redux/selectors/cartSelector';
import restPaymentService from 'services/rest/payment';
import { useLocation } from 'react-router-dom';
import moment from 'moment/moment';
import useDidUpdate from 'helpers/useDidUpdate';
import DeliveryInfo from './delivery-info';
import UserAddModal from './user-add-modal';

export default function OrderTabs() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { currencies, loading } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );
  const { currentBag, bags, currency } = useSelector(
    (state) => state.cart,
    shallowEqual,
  );
  const locat = useLocation();
  const delivery_type = locat?.state?.delivery_type;
  const { before_order_phone_required } = useSelector(
    (state) => state.globalSettings.settings,
    shallowEqual,
  );
  const data = useSelector((state) => getCartData(state.cart));
  const [users, setUsers] = useState([]);
  const [userModal, setUserModal] = useState(null);

  useDidUpdate(() => {
    if (data?.deliveries?.value === 'dine_in') {
      form.setFieldsValue({
        payment_type: data?.paymentType,
      });
    }
  }, [data?.deliveries?.value, currentBag]);

  async function getUsers(search) {
    const params = {
      search,
      perPage: 10,
    };
    return userService.getAll(params).then(({ data }) => {
      setUsers(data);
      return formatUser(data);
    });
  }

  function formatUser(data) {
    if (!data) return;
    if (isArray(data)) {
      return data.map((item) => ({
        label: `${item?.firstname || ''} ${item?.lastname || ''}`,
        value: item?.id,
      }));
    } else {
      return {
        label: `${data?.firstname || ''} ${data?.lastname || ''}`,
        value: data?.id,
      };
    }
  }

  function selectUser(userObj) {
    const user = users.find((item) => item?.id === userObj?.value);
    dispatch(
      setCartData({
        user: userObj,
        userUuid: user?.uuid,
        bag_id: currentBag,
        phone: user?.phone,
        userOBJ: user,
      }),
    );
    form.setFieldsValue({ address: null, phone: user?.phone });
  }

  const goToAddClient = () => {
    setUserModal(true);
  };

  const closeTab = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(removeBag(item));
  };

  function selectCurrency(item) {
    const data = currencies.find((el) => el.id === item.value);
    dispatch(setCurrency(data));
  }

  useEffect(() => {
    if (!currency) {
      const currentCurrency = currencies.find((item) => item.default);
      const formCurrency = {
        label: `${currentCurrency?.title} (${currentCurrency?.symbol})`,
        value: currentCurrency.id,
      };
      dispatch(
        setCartData({
          currentCurrency,
          bag_id: currentBag,
        }),
      );
      dispatch(setCurrency(currentCurrency));
      form.setFieldsValue({
        currency: formCurrency,
      });
    } else {
      const formCurrency = {
        label: `${currency?.title} (${currency?.symbol})`,
        value: currency.id,
      };
      dispatch(
        setCartData({
          formCurrency,
          bag_id: currentBag,
        }),
      );
      form.setFieldsValue({
        currency: formCurrency,
      });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      user: data.user || null,
      payment_type: data.paymentType || null,
      address: data.address.address || null,
      deliveryAddress: data.deliveryAddress,
      delivery: data.deliveries || null,
      delivery_time: data?.delivery_time
        ? moment(`${data?.delivery_date} ${data?.delivery_time}`)
        : null,
      delivery_date: data?.delivery_date ? moment(data?.delivery_date) : null,
      phone: data?.phone || null,
    });
    // eslint-disable-next-line
  }, [currentBag, data]);

  async function fetchPaymentList() {
    return restPaymentService.getAll().then((res) =>
      res?.data
        .filter((el) =>
          data?.deliveries?.value === 'dine_in' ||
          data?.deliveries?.value === 'pickup'
            ? el.tag === 'cash'
            : el.tag === 'cash' || el.tag === 'wallet',
        )
        .map((item) => ({
          label: t(item.tag) || t('N/A'),
          value: item?.tag,
          key: item?.id,
        })),
    );
  }

  return (
    <div className='order-tabs'>
      <div className='tabs-container'>
        <div className='tabs'>
          {bags.map((item) => (
            <div
              key={'tab' + item}
              className={item === currentBag ? 'tab active' : 'tab'}
              onClick={() => dispatch(setCurrentBag(item))}
            >
              <Space>
                <ShoppingCartOutlined />
                <span>
                  {t('bag')} - {item + 1}
                </span>
                {!!item && item === currentBag && (
                  <CloseOutlined
                    onClick={(event) => closeTab(event, item)}
                    className='close-button'
                    size={12}
                  />
                )}
              </Space>
            </div>
          ))}
        </div>
        <Button
          size='small'
          type='primary'
          shape='circle'
          icon={<PlusOutlined />}
          className='tab-add-button'
          onClick={() => dispatch(addBag())}
        />
      </div>
      <Form layout='vertical' name='pos-form' form={form}>
        {!delivery_type && <DeliveryInfo form={form} />}
        <Card>
          {loading && (
            <div className='loader'>
              <Spin />
            </div>
          )}
          <Row gutter={6} style={{ marginBottom: 15 }}>
            {data?.deliveries?.value === 'delivery' && (
              <>
                <Col span={21}>
                  <Form.Item
                    name='user'
                    label={t('user')}
                    rules={[{ required: true, message: '' }]}
                    className='w-100'
                  >
                    <DebounceSelect
                      placeholder={t('select.client')}
                      fetchOptions={getUsers}
                      onSelect={selectUser}
                      onClear={() => {
                        form.setFieldsValue({ phone: null, user: null });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label=' '>
                    <Button
                      icon={<UserAddOutlined />}
                      onClick={goToAddClient}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
            {data?.deliveries?.value === 'delivery' &&
              before_order_phone_required === '1' && (
                <Col span={24}>
                  <Form.Item
                    name='phone'
                    rules={[
                      { required: true, message: t('required') },
                      {
                        validator(_, value) {
                          if (value < 0) {
                            return Promise.reject(
                              new Error(t('must.be.positive')),
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      className='w-100'
                      placeholder={t('phone.number')}
                      disabled={data?.userOBJ?.phone}
                      onChange={(phone) =>
                        dispatch(
                          setCartData({ phone: phone, bag_id: currentBag }),
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              )}

            <Col span={12}>
              <Form.Item
                name='currency'
                label={t('currency')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select
                  placeholder={t('select.currency')}
                  onSelect={selectCurrency}
                  labelInValue
                  disabled
                >
                  {currencies?.map((item, index) => (
                    <Select.Option key={index} value={item?.id}>
                      {`${item?.title} (${item?.symbol})`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('payment.type')}
                name='payment_type'
                rules={[{ required: true, message: t('required') }]}
              >
                <AsyncSelect
                  fetchOptions={fetchPaymentList}
                  className='w-100'
                  placeholder={t('select.payment.type')}
                  onSelect={(paymentType) => {
                    dispatch(setCartData({ paymentType, bag_id: currentBag }));
                  }}
                  refetch={true}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
      {userModal && (
        <UserAddModal
          visible={userModal}
          handleCancel={() => setUserModal(false)}
        />
      )}
    </div>
  );
}
