import React, { useEffect, useState, useContext } from 'react';
import {
  Button,
  Space,
  Table,
  Card,
  Tabs,
  Tag,
  Select,
  DatePicker,
  Modal,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchOrders as fetchSellerOrders } from 'redux/slices/sellerOrders';
import formatSortType from 'helpers/formatSortType';
import SearchInput from 'components/search-input';
import { clearOrder } from 'redux/slices/order';
import numberToPrice from 'helpers/numberToPrice';
import { DebounceSelect } from 'components/search';
import userService from 'services/seller/user';
import FilterColumns from 'components/filter-column';
import { fetchRestOrderStatus } from 'redux/slices/orderStatus';
import DeleteButton from 'components/delete-button';
import { Context } from 'context/context';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import orderService from 'services/seller/order';
import { clearItems } from 'redux/slices/sellerOrders';
import { batch } from 'react-redux';
import moment from 'moment';
import { useQueryParams } from 'helpers/useQueryParams';
import OrderDeliveryman from './orderDeliveryman';
import OrderStatusModal from './orderStatusModal';
import OrderTypeSwitcher from './order-type-switcher';
import TransactionStatusModal from './transactionStatusModal';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export default function SellerOrder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const urlParams = useParams();
  const [id, setId] = useState(null);
  const [text, setText] = useState(null);
  const { setIsModalVisible } = useContext(Context);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );
  const { statusList } = useSelector(
    (state) => state.orderStatus,
    shallowEqual,
  );
  const orderType = urlParams?.type;
  const statuses = [
    { name: 'all', id: 0, active: true, sort: 0 },
    ...statusList,
  ];
  const [orderDeliveryDetails, setOrderDeliveryDetails] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(null);

  const goToShow = (row) => {
    dispatch(
      addMenu({
        url: `seller/order/details/${row.id}`,
        id: 'order_details',
        name: t('order.details'),
      }),
    );
    navigate(`/seller/order/details/${row.id}`);
  };

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('client'),
      is_show: true,
      dataIndex: 'user',
      key: 'user',
      render: (user) => {
        if (!user) {
          return <Tag color='red'>{t('deleted.user')}</Tag>;
        }
        return (
          <div>
            {user?.firstname || ''} {user?.lastname || ''}
          </div>
        );
      },
    },
    {
      title: t('status'),
      is_show: true,
      dataIndex: 'status',
      key: 'status',
      render: (status, row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOrderDetails(row);
          }}
          className='cursor-pointer'
          style={{ width: 'max-content' }}
        >
          {status === 'new' ? (
            <Tag color='blue'>{t(status)}</Tag>
          ) : status === 'canceled' ? (
            <Tag color='red'>{t(status)}</Tag>
          ) : (
            <Tag color='cyan'>{t(status)}</Tag>
          )}
          {status !== 'delivered' &&
          status !== 'canceled' &&
          !row.deleted_at ? (
            <EditOutlined disabled={row.deleted_at} />
          ) : (
            ''
          )}
        </div>
      ),
    },
    {
      title: t('deliveryman'),
      is_show: true,
      dataIndex: 'deliveryman',
      key: 'deliveryman',
      render: (deliveryman, row) => (
        <div>
          {row.status === 'ready' && row.delivery_type !== 'pickup' ? (
            <Button
              disabled={row.deleted_at}
              type='link'
              onClick={() => setOrderDeliveryDetails(row)}
            >
              <Space>
                {deliveryman
                  ? `${deliveryman?.firstname} ${deliveryman?.lastname || ''}`
                  : t('add.deliveryman')}
                <EditOutlined />
              </Space>
            </Button>
          ) : (
            <div>
              {deliveryman?.firstname} {deliveryman?.lastname || ''}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('number.of.products'),
      dataIndex: 'order_details_count',
      key: 'order_details_count',
      is_show: true,
      render: (order_details_count) => {
        return (
          <div className='text-lowercase'>
            {order_details_count || 0} {t('products')}
          </div>
        );
      },
    },
    {
      title: t('amount'),
      dataIndex: 'total_price',
      key: 'total_price',
      is_show: true,
      render: (total_price) => {
        return numberToPrice(
          total_price,
          defaultCurrency?.symbol,
          defaultCurrency?.position,
        );
      },
    },
    {
      title: t('payment.type'),
      dataIndex: 'transaction',
      key: 'transaction',
      is_show: true,
      render: (transaction) => t(transaction?.payment_system?.tag) || '-',
    },
    {
      title: t('last.payment.status'),
      is_show: true,
      dataIndex: 'transaction',
      key: 'transaction',
      render: (transaction, row) => {
        const lastTransaction = row.transactions?.at(-1) || {};
        return (
          <div className='cursor-pointer'>
            <Tag
              color={
                lastTransaction?.status === 'progress'
                  ? 'blue'
                  : lastTransaction?.status === 'paid'
                    ? 'green'
                    : lastTransaction?.status === 'canceled'
                      ? 'red'
                      : lastTransaction?.status === 'rejected'
                        ? 'orange'
                        : lastTransaction?.status === 'refund'
                          ? 'purple'
                          : ''
              }
            >
              {lastTransaction?.status ? t(lastTransaction?.status) : t('N/A')}
            </Tag>
            {!row?.deleted_at && !!lastTransaction && (
              <EditOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTransactionModalOpen(lastTransaction);
                }}
                disabled={row?.deleted_at}
              />
            )}
          </div>
        );
      },
    },
    {
      title: t('created.at'),
      is_show: true,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (_, row) => moment(row?.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('delivery.date'),
      is_show: true,
      dataIndex: 'delivery_date',
      key: 'delivery_date',
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (_, row) => {
        return (
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => goToShow(row)} />
            <DeleteButton
              icon={<DeleteOutlined />}
              onClick={() => {
                setId([row.id]);
                setIsModalVisible(true);
                setText(true);
              }}
            />
          </Space>
        );
      },
    },
  ]);

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const queryParams = useQueryParams();
  const [role, setRole] = useState(queryParams.values.status || 'all');
  const immutable = activeMenu.data?.role || role;
  const { orders, meta, loading, params } = useSelector(
    (state) => state.sellerOrders,
    shallowEqual,
  );
  const [dateRange, setDateRange] = useState(null);
  const data = activeMenu?.data;
  const paramsData = {
    search: data?.search,
    sort: data?.sort,
    column: data?.column,
    perPage: data?.perPage,
    page: data?.page,
    user_id: data?.user_id,
    status:
      immutable === 'deleted_at'
        ? undefined
        : immutable === 'all'
          ? undefined
          : immutable,
    deleted_at: immutable === 'deleted_at' ? 'deleted_at' : undefined,
    shop_id:
      activeMenu.data?.shop_id !== null ? activeMenu.data?.shop_id : null,
    delivery_type: orderType
      ? orderType
      : activeMenu.data?.delivery_type !== null
        ? activeMenu.data?.delivery_type
        : null,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
    date_to: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line
  }, [
    paramsData.page,
    paramsData.perPage,
    paramsData.status,
    paramsData.shop_id,
    paramsData.sort,
    paramsData.user_id,
    paramsData.delivery_type,
    paramsData.date_from,
    paramsData.search,
  ]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  const fetch = () => {
    dispatch(fetchSellerOrders(paramsData));
    dispatch(fetchRestOrderStatus({}));
    dispatch(disableRefetch(activeMenu));
  };

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, perPage, page, column, sort },
      }),
    );
  }

  const orderDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    orderService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        setIsModalVisible(false);
        dispatch(fetchSellerOrders(paramsData));
        setText(null);
      })
      .finally(() => setLoadingBtn(false));
  };

  const handleFilter = (item, name) => {
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, [name]: item },
      }),
    );
  };

  async function getUsers(search) {
    const params = {
      search: search?.length ? search : undefined,
      page: 1,
      perPage: 20,
    };
    return userService.getAll(params).then(({ data }) => {
      return data.map((item) => ({
        label: `${item?.firstname || ''} ${item?.lastname || ''}`,
        value: item?.id,
        key: item?.id,
      }));
    });
  }

  const goToAddOrder = () => {
    dispatch(clearOrder());
    dispatch(
      addMenu({
        id: 'pos.system',
        url: 'seller/pos-system',
        name: t('add.order'),
      }),
    );
    navigate('/seller/pos-system', { state: { delivery_type: orderType } });
  };

  const onChangeTab = (status) => {
    const orderStatus = status;
    dispatch(setMenuData({ activeMenu, data: { role: orderStatus, page: 1 } }));
    setRole(status);
    navigate(`?status=${orderStatus}`);
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const handleClear = () => {
    batch(() => {
      dispatch(clearItems());
      dispatch(
        setMenuData({
          activeMenu,
          data: null,
        }),
      );
    });
    setDateRange(null);
  };

  const handleCloseModal = () => {
    setOrderDeliveryDetails(null);
    setOrderDetails(null);
  };

  return (
    <>
      <Space className='justify-content-end w-100 mb-3'>
        <OrderTypeSwitcher listType='seller/orders' />
        <Button
          type='primary'
          icon={<PlusCircleOutlined />}
          onClick={goToAddOrder}
          style={{ width: '100%' }}
        >
          {t('add.order')}
        </Button>
      </Space>
      <Card>
        <Space wrap className='p-0 mb-0'>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFilter(search, 'search')}
            defaultValue={activeMenu.data?.search}
            style={{ minWidth: 200 }}
            onClear={handleClear}
          />
          <DebounceSelect
            placeholder={t('select.client')}
            fetchOptions={getUsers}
            onSelect={(user) => handleFilter(user?.value, 'user_id')}
            style={{ minWidth: 200 }}
            onClear={handleClear}
            value={data?.user_id}
          />
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              handleFilter(JSON.stringify(values), 'data_time');
              setDateRange(values);
            }}
            style={{ minWidth: 200 }}
            onClear={() => handleClear()}
            defaultValue={dateRange}
          />
          {!orderType && (
            <Select
              value={data?.delivery_type}
              placeholder={t('order.type')}
              onSelect={(type) => handleFilter(type, 'delivery_type')}
              options={[
                { label: t('pickup'), value: 'pickup' },
                { label: t('delivery'), value: 'delivery' },
              ]}
              allowClear
              style={{ minWidth: 200 }}
              onDeselect={() => handleFilter(null, 'delivery_type')}
              onClear={handleClear}
            />
          )}
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            {t('clear')}
          </Button>
        </Space>
      </Card>

      <Card>
        <Space wrap>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      </Card>

      <Card>
        <Tabs onChange={onChangeTab} type='card' activeKey={immutable}>
          {statuses
            .filter((ex) => ex.active === true)
            .map((item) => {
              return <TabPane tab={t(item.name)} key={item.name} />;
            })}
        </Tabs>
        <Table
          scroll={{ x: true }}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={orders}
          loading={loading}
          pagination={{
            pageSize: params.perPage,
            page: activeMenu.data?.page || 1,
            total: meta?.total,
            defaultCurrent: activeMenu.data?.page,
            current: activeMenu.data?.page,
          }}
          rowKey={(record) => record.id}
          onChange={onChangePagination}
        />
        <CustomModal
          click={orderDelete}
          text={text ? t('delete') : t('all.delete')}
          loading={loadingBtn}
          setText={setId}
        />
      </Card>
      {orderDetails && (
        <OrderStatusModal
          orderDetails={orderDetails}
          handleCancel={handleCloseModal}
          status={statusList}
          paramsData={paramsData}
        />
      )}
      {orderDeliveryDetails && (
        <OrderDeliveryman
          orderDetails={orderDeliveryDetails}
          handleCancel={handleCloseModal}
        />
      )}
      {!!isTransactionModalOpen && (
        <Modal
          visible={!!isTransactionModalOpen}
          footer={false}
          onCancel={() => setIsTransactionModalOpen(null)}
        >
          <TransactionStatusModal
            data={isTransactionModalOpen}
            onCancel={() => setIsTransactionModalOpen(null)}
          />
        </Modal>
      )}
    </>
  );
}
