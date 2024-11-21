import React, { useState, useEffect, useRef } from 'react';
import { requestForToken, onMessageListener } from '../firebase';
import NotificationSound from '../assets/audio/web_whatsapp.mp3';
import { Button, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { del, set } from 'idb-keyval';
import { useDispatch, useSelector } from 'react-redux';
import { addMenu } from '../redux/slices/menu';
import { useNavigate } from 'react-router-dom';

export default function PushNotification({ refetch }) {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState({ title: '', body: '' });
  const audioPlayer = useRef(null);

  const deleteItem = (id) => {
    del(id).then(() => refetch());
  };

  const goToShow = (id) => {
    let menuUrl = '';
    let navigationUrl = '';
    if (user.role === 'seller' || user.role === 'moderator') {
      menuUrl = 'seller/';
      navigationUrl = 'seller';
    }
    deleteItem(id);
    dispatch(
      addMenu({
        url: `${menuUrl}order/details/${id}`,
        id: 'order_details',
        name: t('order.details'),
      }),
    );
    navigate(`${navigationUrl}/order/details/${id}`);
  };

  const goToParcel = (id) => {
    deleteItem(id);
    dispatch(
      addMenu({
        url: `parcel-orders`,
        id: 'parcel_orders',
        name: t('parcel.orders'),
      }),
    );
    navigate(`/parcel-orders`);
  };

  const close = () => {
    console.log('Notification was closed');
  };

  const notifyOrder = () => {
    audioPlayer.current.play();
    const key = `open${Date.now()}`;
    const btn = data?.data?.id ? (
      <Button
        type='primary'
        size='small'
        onClick={() => {
          notification.close(key);
          goToShow(data?.data?.id);
        }}
      >
        {t('view.order')}
      </Button>
    ) : null;
    notification.open({
      message: data.title,
      description: data.body,
      btn,
      key,
      onClose: close,
      duration: 0,
      icon: (
        <ShoppingCartOutlined
          style={{
            color: '#3e79f7',
          }}
        />
      ),
    });
  };

  const notifyParcel = () => {
    audioPlayer.current.play();
    const key = `open${Date.now()}`;
    const btn = data?.data?.id ? (
      <Button
        type='primary'
        size='small'
        onClick={() => {
          notification.close(key);
          goToParcel();
        }}
      >
        {t('view.parcel')}
      </Button>
    ) : null;
    notification.open({
      message: data?.title,
      description: data?.body,
      btn,
      key,
      onClose: close,
      duration: 0,
      icon: (
        <ShoppingCartOutlined
          style={{
            color: '#3e79f7',
          }}
        />
      ),
    });
  };

  useEffect(() => {
    if (data?.body) {
      const isParcel = data.body?.includes('parcel');
      isParcel ? notifyParcel() : notifyOrder();
    }
  }, [data]);

  useEffect(() => {
    requestForToken();
  }, []);

  onMessageListener()
    .then((payload) => {
      console.log('payload', payload);
      const title = payload?.notification?.title ?? payload?.notification?.body;
      const body = payload?.notification?.body;
      console.log(title);
      setData({
        title,
        body,
        data: payload?.data,
      });
      set(
        payload?.data?.id || title,
        payload?.data ? { ...payload.data, title: body } : body,
      );
      refetch();
    })
    .catch((err) => console.log('failed: ', err));

  return (
    <div className='notification'>
      <audio
        id='notification-audio'
        ref={audioPlayer}
        src={NotificationSound}
      />
    </div>
  );
}
