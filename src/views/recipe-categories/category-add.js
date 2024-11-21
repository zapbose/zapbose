import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import { fetchRecipeCategories } from 'redux/slices/recipe-category';
import getTranslationFields from 'helpers/getTranslationFields';
import RecipeCategoryForm from './category-form';

const RecipeCategoryAdd = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (values, image) => {
    const body = {
      type: 'receipt',
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      keywords: values?.keywords?.join(','),
      input: values?.input ?? 0,
      images: image?.map((item) => item?.name),
      active: values?.active ? 1 : 0,
      parent_id: undefined,
    };
    const nextUrl = 'catalog/recipe-categories';

    return categoryService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        batch(() => {
          dispatch(fetchRecipeCategories({}));
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        });
        navigate(`/${nextUrl}`);
      })
      .catch((err) => setError(err?.response?.data?.params));
  };

  return (
    <Card title={t('add.category')} extra={<LanguageList />}>
      <RecipeCategoryForm
        form={form}
        handleSubmit={handleSubmit}
        error={error}
      />
    </Card>
  );
};
export default RecipeCategoryAdd;
