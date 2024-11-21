import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import { fetchSellerRecipeCategories } from 'redux/slices/recipe-category';
import sellerCategory from 'services/seller/category';
import RecipeCategoryForm from './category-form';
import getTranslationFields from "helpers/getTranslationFields";

const RecipeCategoryAdd = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (values, image) => {
    const body = {
      ...values,
      type: 'receipt',
      active: values.active ? 1 : 0,
      keywords: values.keywords.join(','),
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      images: [image[0]?.name],
    };
    const nextUrl = 'seller/recipe-categories';

    return sellerCategory
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchSellerRecipeCategories({}));
        });
        navigate(`/${nextUrl}`);
      })
      .catch((err) => setError(err.response.data.params));
  };

  return (
    <Card title={t('add.category')} extra={<LanguageList />}>
      <RecipeCategoryForm
        form={form}
        error={error}
        handleSubmit={handleSubmit}
      />
    </Card>
  );
};
export default RecipeCategoryAdd;
