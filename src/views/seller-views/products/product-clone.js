import React, { useEffect, useState } from 'react';
import { Card, Spin, Steps } from 'antd';
import LanguageList from 'components/language-list';
import { useParams } from 'react-router-dom';
import productService from 'services/seller/product';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from 'helpers/useQueryParams';
import useDidUpdate from 'helpers/useDidUpdate';
import ProductStock from 'components/forms/product/stock';
import { steps } from './steps';
import ProductProperty from './property';
import ProductFinish from './product-finish';
import ProductExtras from './product-extras';
import ProductsIndex from './products-index';

const { Step } = Steps;

const SellerProductsClone = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const queryParams = useQueryParams();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [loading, setLoading] = useState(activeMenu.refetch);

  const current = Number(queryParams.values?.step || 0);

  useEffect(() => {
    fetchProduct(uuid);
    // eslint-disable-next-line
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetchProduct(uuid);
    }
    // eslint-disable-next-line
  }, [activeMenu.refetch]);

  const next = () => {
    const step = current + 1;
    queryParams.set('step', step);
  };
  const prev = () => {
    const step = current - 1;
    queryParams.set('step', step);
  };

  const createImages = (items) =>
    items.map((item) => ({
      uid: item?.id,
      name: item?.path,
      url: item?.path,
    }));

  const createSelectObject = (item) => {
    if (!item) return null;
    return {
      label: item?.translation ? item?.translation?.title : item?.title,
      value: item?.id,
    };
  };

  const fetchProduct = (uuid) => {
    setLoading(true);
    productService
      .getById(uuid)
      .then((res) => {
        const extras = {};
        res?.data?.stocks?.forEach((stock) => {
          stock?.extras?.forEach((extra) => {
            if (extra?.extra_group_id in extras) {
              if (
                !extras?.[extra?.extra_group_id]?.values?.some(
                  (item) => item?.value === extra?.id,
                )
              ) {
                extras?.[extra?.extra_group_id]?.values?.push({
                  value: extra?.id,
                  label: extra?.value,
                  stock_id: stock?.id,
                  group: extra?.group?.translation?.title,
                });
              }
            } else {
              extras[extra?.extra_group_id] = {
                label: extra?.group?.translation?.title,
                value: extra?.extra_group_id,
                id: extra?.extra_group_id,
                stock_id: stock?.id,
                values: [
                  {
                    value: extra?.id,
                    label: extra?.value,
                    stock_id: stock?.id,
                    group: extra?.group?.translation?.title,
                  },
                ],
              };
            }
          });
        });
        const data = {
          ...res?.data,
          ...getLanguageFields(res?.data),
          category: createSelectObject(res?.data?.category),
          brand: createSelectObject(res?.data?.brand),
          kitchen: createSelectObject(res?.data?.kitchen),
          unit: createSelectObject(res?.data?.unit),
          images: createImages(res?.data?.galleries),
          product_id: res?.data?.id,
          extras: Object.values(extras),
          stocks: res?.data?.stocks?.map((stock) => ({
            ...stock,
            ...Object.assign(
              {},
              ...stock?.extras.map((extra, idx) => ({
                [`extras[${idx}]`]: {
                  label: extra?.value,
                  value: extra?.id,
                  group: extra?.group?.translation?.title,
                },
              })),
            ),
            quantity: stock?.quantity || 0,
            extras: undefined,
          })),
          properties: res?.data?.properties?.map((item, index) => ({
            id: index,
            [`key[${item?.locale}]`]: item?.key,
            [`value[${item.locale}]`]: item?.value,
          })),
          translation: undefined,
          translations: undefined,
        };

        dispatch(setMenuData({ activeMenu, data }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const getLanguageFields = (data) => {
    if (!data?.translations) {
      return {};
    }
    const { translations } = data;
    const result = languages?.map((item) => ({
      [`title[${item?.locale}]`]: translations?.find(
        (el) => el?.locale === item?.locale,
      )?.title,
      [`description[${item?.locale}]`]: translations?.find(
        (el) => el?.locale === item?.locale,
      )?.description,
    }));
    return Object.assign({}, ...result);
  };

  const onChange = (step) => {
    dispatch(setMenuData({ activeMenu, data: { ...activeMenu.data, step } }));
    queryParams.set('step', step);
  };

  return (
    <>
      <Card title={t('edit.food')} extra={<LanguageList />}>
        <Steps current={current} onChange={onChange}>
          {steps.map((item) => (
            <Step title={t(item.title)} key={item.title} />
          ))}
        </Steps>
      </Card>
      {!loading ? (
        <div>
          {steps[current].content === 'First-content' && (
            <ProductsIndex next={next} action_type={'edit'} />
          )}
          {steps[current].content === 'Second-content' && (
            <ProductExtras next={next} prev={prev} />
          )}
          {steps[current].content === 'Third-content' && (
            <ProductStock next={next} prev={prev} userRole='seller' />
          )}
          {steps[current].content === 'Fourth-content' && (
            <ProductProperty next={next} prev={prev} />
          )}
          {steps[current].content === 'Finish-content' && (
            <ProductFinish prev={prev} />
          )}
        </div>
      ) : (
        <div className='d-flex justify-content-center align-items-center'>
          <Spin size='large' className='py-5' />
        </div>
      )}
    </>
  );
};
export default SellerProductsClone;
