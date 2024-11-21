import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
} from 'antd';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import TextArea from 'antd/es/input/TextArea';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu, setMenuData } from 'redux/slices/menu';
import sellerCategory from 'services/seller/category';
import { IMG_URL } from 'configs/app-global';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import requestModelsService from 'services/seller/request-models';
import { fetchSellerRequestModels } from 'redux/slices/request-models';
import { DebounceSelect } from 'components/search';

const SellerCategoryRequestEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { params } = useSelector((state) => state.requestModels, shallowEqual);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : [],
  );
  const [form] = Form.useForm();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { state } = useLocation();
  const { user } = useSelector((state) => state.auth, shallowEqual);

  const { id } = useParams();
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createImage = (name) => {
    return {
      name,
      url: IMG_URL + name,
    };
  };

  const getCategory = (alias) => {
    setLoading(true);
    requestModelsService
      .getById(alias)
      .then((res) => {
        let request = res.data;
        const body = {
          ...request?.data,
          keywords: request.data?.keywords.split(','),
          parent_id: {
            label: request.parent?.translation?.title,
            value: request.data.parent_id,
            key: request.data.parent_id,
          },
          input: request?.data?.input || 0,
        };
        form.setFieldsValue(body);
        setImage([createImage(request.data.images?.at(0))]);
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      id: values.id,
      type: 'category',
      data: {
        ...values,
        type: state?.parentId ? 'sub_main' : 'main',
        active: values?.active ? 1 : 0,
        keywords: values?.keywords?.join(','),
        parent_id: values?.parent_id?.value,
        images: image?.map((img) => img?.name),
      },
    };
    const paramsData = { ...params, shop_id: user?.shop_id };
    const nextUrl = state?.parentId
      ? `seller/category/${state.parentUuid}`
      : 'seller/categories';
    requestModelsService
      .requestChangeUpdate(id, body)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        dispatch(fetchSellerRequestModels(paramsData));
        navigate(`/${nextUrl}`, { state: { tab: 'request' } });
      })
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      getCategory(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  const fetchUserCategoryList = (search) => {
    const params = {
      perPage: 100,
      type: state?.parentId ? 'main' : 'sub_shop',
      active: 1,
      search,
    };
    return sellerCategory.selectPaginate(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  return (
    <Card title={t('edit.request')} extra={<LanguageList />}>
      {!loading ? (
        <Form
          name='basic'
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            active: true,
            ...activeMenu.data,
          }}
          form={form}
        >
          <Row gutter={12}>
            <Form.Item name='id' hidden>
              <InputNumber />
            </Form.Item>
            <Col span={12}>
              {languages.map((item) => (
                <Form.Item
                  label={t('name')}
                  name={`title[${item?.locale || 'en'}]`}
                  key={item?.locale}
                  hidden={item?.locale !== defaultLang}
                  rules={[
                    {
                      required: item?.locale === defaultLang,
                      message: t('required'),
                    },
                    {
                      type: 'string',
                      min: 2,
                      max: 200,
                      message: t('min.2.max.200.chars'),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              ))}
            </Col>

            <Col span={12}>
              {languages.map((item) => (
                <Form.Item
                  label={t('description')}
                  name={`description[${item?.locale || 'en'}]`}
                  key={item?.locale}
                  hidden={item?.locale !== defaultLang}
                  rules={[
                    {
                      required: item?.locale === defaultLang,
                      message: t('required'),
                    },
                    {
                      type: 'string',
                      min: 2,
                      max: 200,
                      message: t('min.2.max.200.chars'),
                    },
                  ]}
                >
                  <TextArea rows={2} />
                </Form.Item>
              ))}
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('keywords')}
                name='keywords'
                rules={[{ required: true, message: t('required') }]}
              >
                <Select mode='tags' style={{ width: '100%' }}></Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('parent.category')}
                name='parent_id'
                rules={[{ required: true, message: t('required') }]}
              >
                <DebounceSelect fetchOptions={fetchUserCategoryList} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='input'
                label={t('position')}
                rules={[
                  {
                    required: true,
                    message: t('required'),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  parser={(value) => parseInt(value, 10)}
                  max={32767}
                  className='w-100'
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={t('image')}
                name='images'
                rules={[
                  {
                    required: !image?.length,
                    message: t('required'),
                  },
                ]}
              >
                <MediaUpload
                  type='categories'
                  imageList={image}
                  setImageList={setImage}
                  form={form}
                  multiple={false}
                />
              </Form.Item>
            </Col>
          </Row>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('submit')}
          </Button>
        </Form>
      ) : (
        <div className='d-flex justify-content-center align-items-center py-5'>
          <Spin size='large' className='mt-5 pt-5' />
        </div>
      )}
    </Card>
  );
};
export default SellerCategoryRequestEdit;
