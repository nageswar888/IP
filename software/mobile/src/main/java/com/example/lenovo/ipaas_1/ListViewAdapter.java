package com.example.lenovo.ipaas_1;

/**
 * Created by Lenovo on 11/17/2016.
 */

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import java.util.ArrayList;

//Listview adapter that displays each item of the
public class ListViewAdapter extends BaseAdapter{

    public ArrayList<AdviceObject> list;
    Activity activity;
    TextView txtFirst;
    TextView txtSecond;

    public ListViewAdapter(Activity activity,ArrayList<AdviceObject> list){
        super();
        this.activity=activity;
        this.list=list;
    }

    @Override
    public int getCount() {
        // TODO Auto-generated method stub
        return list.size();
    }

    @Override
    public Object getItem(int position) {
        // TODO Auto-generated method stub
        return list.get(position);
    }

    @Override
    public long getItemId(int position) {
        // TODO Auto-generated method stub
        return 0;
    }



    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        // TODO Auto-generated method stub



        LayoutInflater inflater=activity.getLayoutInflater();

        if(convertView == null){

            convertView=inflater.inflate(R.layout.colmn_row, null);

            txtFirst=(TextView) convertView.findViewById(R.id.name);
            txtSecond=(TextView) convertView.findViewById(R.id.amount);
        }
            txtFirst.setText(list.get(position).getName()); //set name and amount of payee
            txtSecond.setText(list.get(position).getAmount()+"");

        return convertView;
    }
}