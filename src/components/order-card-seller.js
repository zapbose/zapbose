import React from 'react';
import {
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  ContainerOutlined,
  CarOutlined,
  DollarOutlined,
  PayCircleOutlined,
  BorderlessTableOutlined,
  FieldTimeOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Avatar, Card, List, Skeleton, Space } from 'antd';
import { IMG_URL } from '../configs/app-global';
import numberToPrice from '../helpers/numberToPrice';
import moment from 'moment';
import { BiMap } from 'react-icons/bi';
import useDemo from '../helpers/useDemo';
import { useTranslation } from 'react-i18next';

const { Meta } = Card;

const OrderCardSeller = ({
  data: item,
  goToShow,
  loading,
  setLocationsMap,
  setId,
  setIsModalVisible,
  setText,
  setDowloadModal,
  setType,
  orderType,
  setIsTransactionModalOpen,
}) => {
  const { isDemo, demoFunc } = useDemo();
  const { t } = useTranslation();
  const lastTransaction = item.transactions?.at(-1) || {};
  const data = [
    {
      title: 'Client',
      icon: <UserOutlined />,
      data: item?.user
        ? `${item.user?.firstname || '-'} ${item.user?.lastname || '-'}`
        : t('deleted.user'),
    },
    {
      title: 'Number of products',
      icon: <ContainerOutlined />,
      data: item?.order_details_count,
    },
    {
      title: orderType ? 'Table' : 'Deliveryman',
      icon: <CarOutlined />,
      data: orderType
        ? `${item?.table?.name || '-'}`
        : `${item.deliveryman?.firstname || '-'} ${
            item.deliveryman?.lastname || '-'
          }`,
    },
    {
      title: 'Amount',
      icon: <DollarOutlined />,
      data: numberToPrice(
        item.total_price,
        item.currency?.symbol,
        item.currency?.position,
      ),
    },
    {
      title: 'Last Payment type',
      icon: <PayCircleOutlined />,
      data: lastTransaction?.payment_system?.tag || '-',
    },
    {
      title: 'Last Payment status',
      icon: <BorderlessTableOutlined />,
      data: lastTransaction?.status ? (
        <div
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsTransactionModalOpen(lastTransaction);
          }}
        >
          {lastTransaction?.status}{' '}
          <EditOutlined disabled={item?.deleted_at} />
        </div>
      ) : (
        '-'
      ),
    },
    {
      title: t('delivery.type'),
      icon: <FieldTimeOutlined />,
      data: item?.delivery_type || '-',
    },
    {
      title: 'Delivery date',
      icon: <FieldTimeOutlined />,
      data: moment(item?.delivery_date).format('YYYY-MM-DD') || '-',
    },
    {
      title: 'Created at',
      icon: <FieldTimeOutlined />,
      data: moment(item?.created_at).format('YYYY-MM-DD') || '-',
    },
  ];

  return (
    <Card
      actions={[
        <BiMap
          size={20}
          onClick={(e) => {
            e.stopPropagation();
            setLocationsMap(item.id);
          }}
        />,
        <EyeOutlined key='setting' onClick={() => goToShow(item)} />,
        <DeleteOutlined
          onClick={(e) => {
            if (isDemo) {
              demoFunc();
              return;
            }
            e.stopPropagation();
            setId([item.id]);
            setIsModalVisible(true);
            setText(true);
            setType(item.status);
          }}
        />,
        <DownloadOutlined
          key='ellipsis'
          onClick={() => setDowloadModal(item.id)}
        />,
      ]}
      className='order-card'
    >
      <Skeleton loading={loading} avatar active>
        <Meta
          avatar={
            <Avatar src={IMG_URL + item.user?.img} icon={<UserOutlined />} />
          }
          description={`#${item.id}`}
          title={`${item.user?.firstname || '-'} ${item.user?.lastname || '-'}`}
        />
        <List
          itemLayout='horizontal'
          dataSource={data}
          renderItem={(item, key) => (
            <List.Item key={key}>
              <Space>
                {item?.icon}
                <span>
                  {`${item?.title}:`}
                  {item?.data}
                </span>
              </Space>
            </List.Item>
          )}
        />
      </Skeleton>
    </Card>
  );
};

export default OrderCardSeller;
