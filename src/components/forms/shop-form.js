import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  TreeSelect,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import Map from '../map';
import MediaUpload from '../upload';
import { AppstoreOutlined, FileOutlined } from '@ant-design/icons';
import { RefetchSearch } from '../refetch-search';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import shopTagService from 'services/shopTag';
import categoryService from 'services/category';
import userService from 'services/user';
import UserModal from 'components/shop/user-modal';
import CategoryModal from 'components/shop/category-modal';
import { AsyncTreeSelect } from 'components/async-tree-select-category';
import { MAP_API_KEY } from 'configs/app-global';
import useGoogle from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import getAddress from 'helpers/getAddress';
import { orderPayments } from 'constants/index';

const { SHOW_ALL } = TreeSelect;

const ShopFormData = ({
  backImage,
  setBackImage,
  logoImage,
  setLogoImage,
  form,
  user,
  setLocation,
  location,
  emailStatusOptions,
}) => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const categories = Form.useWatch('categories', form);
  const [userModal, setUserModal] = useState(null);
  const [category, setCategory] = useState(null);
  const [userRefetch, setUserRefetch] = useState(null);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const [value, setValue] = useState('');

  const sellerDocuments = activeMenu?.data?.documents || [];

  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } =
    useGoogle({
      apiKey: MAP_API_KEY,
      libraries: ['places', 'geocode'],
    });

  const orderPaymentOptions = orderPayments.map((item) => ({
    label: t(item),
    value: item,
    key: item,
  }));

  async function fetchUserList(search) {
    const params = { search, roles: 'user', 'empty-shop': 1 };
    setUserRefetch(false);
    return userService.search(params).then((res) =>
      res.data.map((item) => ({
        label: item.firstname + ' ' + (item.lastname || ''),
        value: item.id,
      })),
    );
  }

  async function fetchShopCategory(search) {
    const params = { search, type: 'shop', active: 1, lang: defaultLang };
    setUserRefetch(false);
    return categoryService.getAll(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
        disabled: item.children?.length === 0,
        children: item.children.map((child) => ({
          label: child.translation?.title,
          value: child.id,
          parent: {
            label: item.translation?.title || 'no name',
            value: item.id,
          },
        })),
      })),
    );
  }

  async function fetchShopTag(search) {
    setUserRefetch(false);
    const params = { search };
    return shopTagService.getAll(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }

  const goToAddClient = () => {
    setUserModal(true);
    setUserRefetch(true);
  };

  const handleCancel = () => {
    setUserModal(false);
    setCategory(false);
  };

  const handleCategorySelect = (node) => {
    if (node.children) {
      if (categories.some((category) => category.value === node.value)) {
        const categoriesWithoutParent = categories.filter(
          (category) => category.value !== node.value,
        );
        const filteredCategories = categoriesWithoutParent.filter(
          (category) =>
            !node.children.some((child) => child.value === category.value),
        );
        form.setFieldsValue({ categories: filteredCategories });
      } else {
        form.setFieldsValue({
          categories: categories.concat([
            { label: node.label, value: node.value },
            ...node.children.map((child) => ({
              label: child.label,
              value: child.value,
            })),
          ]),
        });
      }
    } else {
      if (categories?.some((category) => category.value === node.value)) {
        form.setFieldsValue({
          categories: categories.filter(
            (category) => category.value !== node.value,
          ),
        });
      } else {
        form.setFieldsValue({
          categories: categories.concat([
            node.parent,
            { label: node.label, value: node.value },
          ]),
        });
      }
    }
  };

  const tagRender = (props) => {
    const { label, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  return (
    <Row gutter={12}>
      <Col span={24}>
        <Card>
          <Row gutter={12}>
            <Col span={4}>
              <Form.Item
                label={t('logo.image')}
                name='logo_img'
                rules={[
                  {
                    validator(_, value) {
                      if (logoImage?.length === 0) {
                        return Promise.reject(new Error(t('required')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/logo'
                  imageList={logoImage}
                  setImageList={setLogoImage}
                  form={form}
                  multiple={false}
                  name='logo_img'
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={t('background.image')}
                name='background_img'
                rules={[
                  {
                    validator(_, value) {
                      if (backImage?.length === 0) {
                        return Promise.reject(new Error(t('required')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/background'
                  imageList={backImage}
                  setImageList={setBackImage}
                  form={form}
                  multiple={false}
                  name='background_img'
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label={t('status.note')}
                name='status_note'
                rules={[
                  {
                    validator(_, value) {
                      if (!value) {
                        return Promise.reject(new Error(t('required')));
                      } else if (value && value?.trim() === '') {
                        return Promise.reject(new Error(t('no.empty.space')));
                      } else if (value && value?.length < 5) {
                        return Promise.reject(
                          new Error(t('must.be.at.least.5')),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name='status' label={t('status')}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item label={t('open')} name='open' valuePropName='checked'>
                <Switch disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('general')}>
          <Row gutter={12}>
            <Col span={12}>
              <Row gutter={12}>
                <Col span={24}>
                  {languages.map((item, idx) => (
                    <Form.Item
                      key={'title' + idx}
                      label={t('title')}
                      name={`title[${item.locale}]`}
                      rules={[
                        {
                          validator(_, value) {
                            if (!value && item?.locale === defaultLang) {
                              return Promise.reject(new Error(t('required')));
                            } else if (value && value?.trim() === '') {
                              return Promise.reject(
                                new Error(t('no.empty.space')),
                              );
                            } else if (value && value?.length < 2) {
                              return Promise.reject(
                                new Error(t('must.be.at.least.2')),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      hidden={item.locale !== defaultLang}
                    >
                      <Input />
                    </Form.Item>
                  ))}
                </Col>
                <Col span={24}>
                  <Form.Item
                    label={t('phone')}
                    name='phone'
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <InputNumber min={0} className='w-100' />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              {languages.map((item, idx) => (
                <Form.Item
                  key={'desc' + idx}
                  label={t('description')}
                  name={`description[${item.locale}]`}
                  rules={[
                    {
                      validator(_, value) {
                        if (!value && item?.locale === defaultLang) {
                          return Promise.reject(new Error(t('required')));
                        } else if (value && value?.trim() === '') {
                          return Promise.reject(new Error(t('no.empty.space')));
                        } else if (value && value?.length < 5) {
                          return Promise.reject(
                            new Error(t('must.be.at.least.5')),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  hidden={item.locale !== defaultLang}
                >
                  <TextArea rows={4} />
                </Form.Item>
              ))}
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('seller')}
                name='user'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  disabled={!user}
                  fetchOptions={fetchUserList}
                  refetch={userRefetch}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Button
                        className='w-100'
                        icon={<AppstoreOutlined />}
                        onClick={goToAddClient}
                      >
                        {t('add.user')}
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
            {!!sellerDocuments?.length && (
              <Col span={12}>
                <Form.Item label={t('uploaded.documents.for.verification')}>
                  <Space gap='4px 0' wrap>
                    {sellerDocuments?.map((item) => (
                      <a
                        href={item?.path}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Tag icon={<FileOutlined />}>{item?.title}</Tag>
                      </a>
                    ))}
                  </Space>
                </Form.Item>
              </Col>
            )}
            <Col span={6}>
              <Form.Item
                label={t('shop.tags')}
                name='tags'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  mode='multiple'
                  fetchOptions={fetchShopTag}
                  refetch={userRefetch}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={t('categories')}
                name='categories'
                rules={[{ required: true, message: t('required') }]}
              >
                <AsyncTreeSelect
                  treeCheckable
                  tagRender={tagRender}
                  showCheckedStrategy={SHOW_ALL}
                  treeCheckStrictly
                  refetch
                  onSelect={(value, node) => handleCategorySelect(node)}
                  onDeselect={(value, node) => handleCategorySelect(node)}
                  fetchOptions={fetchShopCategory}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name='emailStatuses' label={t('order.statuses.for.email.notifications')}>
                <Select mode='multiple' options={emailStatusOptions} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={8}>
        <Card title={t('delivery')}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name='price'
                label={t('min.price')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='price_per_km'
                label={t('price.per.km')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card title={t('delivery.time')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='delivery_time_type'
                label={t('delivery_time_type')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select className='w-100'>
                  <Select.Option value='minute' label={t('minutes')} />
                  <Select.Option value='hour' label={t('hour')} />
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_from'
                label={t('delivery_time_from')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_to'
                label={t('delivery_time_to')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card title={t('order.info')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={t('min.amount')}
                name='min_amount'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('tax')}
                name='tax'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  addonAfter={'%'}
                  className='w-100'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('admin.comission')}
                name='percentage'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  className='w-100'
                  addonAfter={'%'}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <Card title={t('qr.menu.settings')}>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name='wifi_name' label={t('shop.wifi.name')}>
                <Input className='w-100' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='wifi_password' label={t('shop.wifi.password')}>
                <Input className='w-100' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={t('order.payment')}
                name='order_payment'
                rules={[{ required: true, message: t('required') }]}
              >
                <Select options={orderPaymentOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name='new_order_after_payment'
                label={t('new.order.after.payment')}
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('address')}>
          <Row gutter={12}>
            <Col span={12}>
              {languages.map((item, idx) => (
                <Form.Item
                  key={'address' + idx}
                  label={t('address')}
                  name={`address[${item.locale}]`}
                  rules={[
                    {
                      required: item.locale === defaultLang,
                      message: t('required'),
                    },
                  ]}
                  hidden={item.locale !== defaultLang}
                >
                  <Select
                    allowClear
                    searchValue={value}
                    showSearch
                    autoClearSearchValue
                    loading={isPlacePredictionsLoading}
                    options={placePredictions?.map((prediction) => ({
                      label: prediction.description,
                      value: prediction.description,
                    }))}
                    onSearch={(searchValue) => {
                      setValue(searchValue);
                      if (searchValue.length > 0) {
                        getPlacePredictions({ input: searchValue });
                      }
                    }}
                    onSelect={async (value) => {
                      const address = await getAddress(value);
                      setLocation({
                        lat: address?.geometry.location.lat,
                        lng: address?.geometry.location.lng,
                      });
                    }}
                  />
                </Form.Item>
              ))}
            </Col>

            <Col span={24}>
              <Map
                location={location}
                setLocation={setLocation}
                setAddress={(value) =>
                  form.setFieldsValue({ [`address[${defaultLang}]`]: value })
                }
              />
            </Col>
          </Row>
        </Card>
      </Col>
      {userModal && (
        <UserModal visible={userModal} handleCancel={() => handleCancel()} />
      )}
      {category && (
        <CategoryModal visible={category} handleCancel={() => handleCancel()} />
      )}
    </Row>
  );
};

export default ShopFormData;
