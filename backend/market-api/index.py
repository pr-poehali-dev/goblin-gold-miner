import json
import os
import psycopg2
from datetime import datetime
from decimal import Decimal

def get_db_connection():
    '''Подключение к БД'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    '''API для P2P маркета: создание, просмотр и покупка объявлений'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'listings')
        
        if action == 'listings' and method == 'GET':
            cur.execute("""
                SELECT ml.id, p.user_id, ml.gold_amount, ml.price_per_kg, ml.total_price, ml.created_at
                FROM market_listings ml
                JOIN players p ON ml.seller_id = p.id
                WHERE ml.status = 'active'
                ORDER BY ml.created_at DESC
                LIMIT 50
            """)
            
            listings = []
            for row in cur.fetchall():
                listing_id, seller_user_id, gold_amount, price_per_kg, total_price, created_at = row
                listings.append({
                    'id': listing_id,
                    'seller': f"Player#{seller_user_id[-4:]}",
                    'amount': float(gold_amount),
                    'price': float(price_per_kg),
                    'total': float(total_price),
                    'created_at': created_at.isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'listings': listings}),
                'isBase64Encoded': False
            }
        
        elif action == 'create-listing' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            gold_amount = float(body.get('gold_amount', 0))
            price_per_kg = float(body.get('price_per_kg', 0))
            
            if gold_amount < 100:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Минимум 100 кг золота'}),
                    'isBase64Encoded': False
                }
            
            if price_per_kg <= 0:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Цена должна быть больше 0'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, gold FROM players WHERE user_id = %s", (user_id,))
            player = cur.fetchone()
            
            if not player:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Игрок не найден'}),
                    'isBase64Encoded': False
                }
            
            player_id, current_gold = player
            
            if float(current_gold) < gold_amount:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Недостаточно золота'}),
                    'isBase64Encoded': False
                }
            
            total_price = gold_amount * price_per_kg
            new_gold = float(current_gold) - gold_amount
            
            cur.execute(
                "UPDATE players SET gold = %s WHERE id = %s",
                (new_gold, player_id)
            )
            
            cur.execute(
                "INSERT INTO market_listings (seller_id, gold_amount, price_per_kg, total_price) VALUES (%s, %s, %s, %s) RETURNING id",
                (player_id, gold_amount, price_per_kg, total_price)
            )
            listing_id = cur.fetchone()[0]
            
            cur.execute(
                "INSERT INTO transactions (player_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (player_id, 'listing_created', gold_amount, f"Создано объявление на {gold_amount} кг по {price_per_kg} TON/кг")
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'listing_id': listing_id,
                    'new_gold': new_gold
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'buy-listing' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            listing_id = body.get('listing_id')
            
            cur.execute("""
                SELECT ml.id, ml.seller_id, ml.gold_amount, ml.price_per_kg, ml.total_price, ml.status
                FROM market_listings ml
                WHERE ml.id = %s
            """, (listing_id,))
            
            listing = cur.fetchone()
            
            if not listing:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Объявление не найдено'}),
                    'isBase64Encoded': False
                }
            
            _, seller_id, gold_amount, price_per_kg, total_price, status = listing
            
            if status != 'active':
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Объявление уже неактивно'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, ton_balance FROM players WHERE user_id = %s", (user_id,))
            buyer = cur.fetchone()
            
            if not buyer:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Покупатель не найден'}),
                    'isBase64Encoded': False
                }
            
            buyer_id, buyer_balance = buyer
            
            if buyer_id == seller_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Нельзя купить своё объявление'}),
                    'isBase64Encoded': False
                }
            
            buyer_fee = float(total_price) * 0.05
            total_cost = float(total_price) + buyer_fee
            
            if float(buyer_balance) < total_cost:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Недостаточно TON. Нужно {total_cost:.4f} TON (включая комиссию 5%)'}),
                    'isBase64Encoded': False
                }
            
            seller_fee = float(total_price) * 0.05
            seller_receives = float(total_price) - seller_fee
            
            cur.execute("SELECT ton_balance, gold FROM players WHERE id = %s", (seller_id,))
            seller_data = cur.fetchone()
            seller_balance, seller_gold = seller_data
            
            new_buyer_balance = float(buyer_balance) - total_cost
            new_seller_balance = float(seller_balance) + seller_receives
            
            cur.execute("SELECT gold FROM players WHERE id = %s", (buyer_id,))
            buyer_gold = cur.fetchone()[0]
            new_buyer_gold = float(buyer_gold) + float(gold_amount)
            
            cur.execute(
                "UPDATE players SET ton_balance = %s, gold = %s WHERE id = %s",
                (new_buyer_balance, new_buyer_gold, buyer_id)
            )
            
            cur.execute(
                "UPDATE players SET ton_balance = %s WHERE id = %s",
                (new_seller_balance, seller_id)
            )
            
            cur.execute(
                "UPDATE market_listings SET status = 'sold', updated_at = NOW() WHERE id = %s",
                (listing_id,)
            )
            
            cur.execute(
                "INSERT INTO transactions (player_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (buyer_id, 'market_purchase', total_cost, f"Куплено {gold_amount} кг золота")
            )
            
            cur.execute(
                "INSERT INTO transactions (player_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (seller_id, 'market_sale', seller_receives, f"Продано {gold_amount} кг золота")
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'new_balance': new_buyer_balance,
                    'new_gold': new_buyer_gold,
                    'paid': total_cost,
                    'fee': buyer_fee
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint не найден'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()