import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, Form } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import getTranslationFields from 'helpers/getTranslationFields';
import LanguageList from 'components/language-list';
import { fetchBranch } from 'redux/slices/branch';
import branchService from 'services/seller/branch';
import BranchForm from './branch-form';

const SellerBranchAdd = () => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      data.open_time = JSON.stringify(data?.open_time);
      data.close_time = JSON.stringify(data?.close_time);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (values) => {
    const body = {
      title: getTranslationFields(languages, values, 'title'),
      address: {
        address: values.address,
        office: null,
        house: null,
        floor: null,
      },
      location: {
        longitude: values.location.lng,
        latitude: values.location.lat,
      },
    };
    const nextUrl = 'seller/branch';

    return branchService.create(body).then(() => {
      toast.success(t('successfully.created'));
      batch(() => {
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        dispatch(fetchBranch({}));
      });
      navigate(`/${nextUrl}`);
    });
  };

  return (
    <Card title={t('add.branch')} className='h-100' extra={<LanguageList />}>
      <BranchForm form={form} handleSubmit={handleSubmit} />
    </Card>
  );
};

export default SellerBranchAdd;
